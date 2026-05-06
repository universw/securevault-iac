require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const { CognitoJwtVerifier } = require("aws-jwt-verify");

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const app = express();
const PORT = process.env.PORT || 3000;

const AWS_REGION = process.env.AWS_REGION || "ap-northeast-1";
const FILES_BUCKET = process.env.FILES_BUCKET;
const FILES_TABLE = process.env.FILES_TABLE;
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_BYTES || 25 * 1024 * 1024);
const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://securevault-iac.vercel.app",
];
const CORS_ORIGINS = (process.env.CORS_ORIGINS || DEFAULT_CORS_ORIGINS.join(","))
  .split(",")
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const missingConfig = [
  !FILES_BUCKET && "FILES_BUCKET",
  !FILES_TABLE && "FILES_TABLE",
  !COGNITO_USER_POOL_ID && "COGNITO_USER_POOL_ID",
  !COGNITO_CLIENT_ID && "COGNITO_CLIENT_ID",
].filter(Boolean);

if (missingConfig.length > 0) {
  throw new Error(`Missing backend configuration: ${missingConfig.join(", ")}`);
}

const s3 = new S3Client({ region: AWS_REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }));

const verifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO_USER_POOL_ID,
  tokenUse: "id",
  clientId: COGNITO_CLIENT_ID,
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || CORS_ORIGINS.includes(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
  })
);
app.use(express.json());

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifier.verify(token);

    req.user = {
      userId: payload.sub,
      email: payload.email,
      username: payload["cognito:username"],
    };

    next();
  } catch (error) {
    console.error("auth error:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
}

function getAuthenticatedUserId(req) {
  return req.user.userId;
}

function normalizeOrigin(origin) {
  return origin.trim().replace(/\/$/, "").toLowerCase();
}

function normalizeFileName(fileName) {
  return fileName
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 255);
}

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "securevault-backend",
    environment: process.env.NODE_ENV || "dev",
  });
});

app.post("/upload-url", authenticate, async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    const fileSize = Number(req.body.fileSize);
    const userId = getAuthenticatedUserId(req);
    const safeFileName = typeof fileName === "string" ? normalizeFileName(fileName) : "";

    if (!safeFileName || !contentType || !Number.isFinite(fileSize)) {
      return res.status(400).json({
        error: "fileName, contentType, and fileSize are required",
      });
    }

    if (fileSize <= 0 || fileSize > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        error: `File must be between 1 byte and ${MAX_FILE_SIZE_BYTES} bytes`,
      });
    }

    const fileId = randomUUID();
    const s3Key = `${userId}/${fileId}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: FILES_BUCKET,
      Key: s3Key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    await ddb.send(
      new PutCommand({
        TableName: FILES_TABLE,
        Item: {
          userId,
          fileId,
          fileName: safeFileName,
          contentType,
          fileSize,
          s3Key,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      })
    );

    res.json({
      fileId,
      s3Key,
      uploadUrl,
      status: "pending",
    });
  } catch (error) {
    console.error("upload-url error:", error);
    res.status(500).json({ error: "Failed to create upload URL" });
  }
});

app.post("/files/:fileId/confirm", authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = getAuthenticatedUserId(req);

    const result = await ddb.send(
      new GetCommand({
        TableName: FILES_TABLE,
        Key: { userId, fileId },
      })
    );

    if (!result.Item) {
      return res.status(404).json({ error: "File upload record not found" });
    }

    if (!result.Item.s3Key) {
      return res.status(400).json({ error: "File metadata has no S3 key" });
    }

    const objectHead = await s3.send(
      new HeadObjectCommand({
        Bucket: FILES_BUCKET,
        Key: result.Item.s3Key,
      })
    );

    if (Number(objectHead.ContentLength || 0) !== Number(result.Item.fileSize || 0)) {
      return res.status(400).json({ error: "Uploaded file size does not match metadata" });
    }

    if (
      result.Item.contentType &&
      objectHead.ContentType &&
      objectHead.ContentType !== result.Item.contentType
    ) {
      return res.status(400).json({ error: "Uploaded file type does not match metadata" });
    }

    await ddb.send(
      new UpdateCommand({
        TableName: FILES_TABLE,
        Key: { userId, fileId },
        UpdateExpression: "SET #status = :status, uploadedAt = :uploadedAt, fileSize = :fileSize",
        ConditionExpression: "attribute_exists(userId) AND attribute_exists(fileId)",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "uploaded",
          ":uploadedAt": new Date().toISOString(),
          ":fileSize": objectHead.ContentLength || result.Item.fileSize,
        },
      })
    );

    res.json({
      confirmed: true,
      userId,
      fileId,
      status: "uploaded",
      fileSize: objectHead.ContentLength || result.Item.fileSize,
    });
  } catch (error) {
    console.error("confirm upload error:", error);
    if (error.name === "ConditionalCheckFailedException") {
      return res.status(404).json({ error: "File upload record not found" });
    }

    res.status(500).json({ error: "Failed to confirm upload" });
  }
});

app.get("/download-url/:fileId", authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = getAuthenticatedUserId(req);

    const result = await ddb.send(
      new GetCommand({
        TableName: FILES_TABLE,
        Key: { userId, fileId },
      })
    );

    if (!result.Item) {
      return res.status(404).json({ error: "File not found" });
    }

    if (result.Item.status !== "uploaded") {
      return res.status(400).json({ error: "File has not been uploaded yet" });
    }

    if (!result.Item.s3Key) {
      return res.status(400).json({ error: "File metadata has no S3 key" });
    }

    const command = new GetObjectCommand({
      Bucket: FILES_BUCKET,
      Key: result.Item.s3Key,
    });

    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    res.json({
      fileId,
      fileName: result.Item.fileName,
      downloadUrl,
    });
  } catch (error) {
    console.error("download-url error:", error);
    res.status(500).json({ error: "Failed to create download URL" });
  }
});

app.get("/files", authenticate, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const result = await ddb.send(
      new QueryCommand({
        TableName: FILES_TABLE,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      })
    );

    res.json({ files: result.Items || [] });
  } catch (error) {
    console.error("list files error:", error);
    res.status(500).json({ error: "Failed to list files" });
  }
});

app.delete("/files/:fileId", authenticate, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = getAuthenticatedUserId(req);

    const result = await ddb.send(
      new GetCommand({
        TableName: FILES_TABLE,
        Key: { userId, fileId },
      })
    );

    if (!result.Item) {
      return res.status(404).json({ error: "File not found" });
    }

    if (result.Item.s3Key) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: FILES_BUCKET,
          Key: result.Item.s3Key,
        })
      );
    }

    await ddb.send(
      new DeleteCommand({
        TableName: FILES_TABLE,
        Key: { userId, fileId },
      })
    );

    res.json({
      deleted: true,
      fileId,
      deletedS3Object: Boolean(result.Item.s3Key),
    });
  } catch (error) {
    console.error("delete file error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

app.listen(PORT, () => {
  console.log(`SecureVault backend running on port ${PORT}`);
});
