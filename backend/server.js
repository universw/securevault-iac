const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

const app = express();
const PORT = process.env.PORT || 3000;

const AWS_REGION = process.env.AWS_REGION || "ap-northeast-1";
const FILES_BUCKET = process.env.FILES_BUCKET;
const FILES_TABLE = process.env.FILES_TABLE;

const s3 = new S3Client({ region: AWS_REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }));

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "securevault-backend",
    environment: process.env.NODE_ENV || "dev",
  });
});

app.post("/upload-url", async (req, res) => {
  try {
    const { userId, fileName, contentType } = req.body;

    if (!userId || !fileName || !contentType) {
      return res.status(400).json({
        error: "userId, fileName, and contentType are required",
      });
    }

    const fileId = randomUUID();
    const s3Key = `${userId}/${fileId}-${fileName}`;

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
          fileName,
          contentType,
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

app.post("/files/:userId/:fileId/confirm", async (req, res) => {
  try {
    const { userId, fileId } = req.params;

    await ddb.send(
      new UpdateCommand({
        TableName: FILES_TABLE,
        Key: { userId, fileId },
        UpdateExpression: "SET #status = :status, uploadedAt = :uploadedAt",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": "uploaded",
          ":uploadedAt": new Date().toISOString(),
        },
      })
    );

    res.json({
      confirmed: true,
      userId,
      fileId,
      status: "uploaded",
    });
  } catch (error) {
    console.error("confirm upload error:", error);
    res.status(500).json({ error: "Failed to confirm upload" });
  }
});

app.get("/files/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

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

app.delete("/files/:userId/:fileId", async (req, res) => {
  try {
    const { userId, fileId } = req.params;
    const { s3Key } = req.body;

    if (!s3Key) {
      return res.status(400).json({ error: "s3Key is required" });
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: FILES_BUCKET,
        Key: s3Key,
      })
    );

    await ddb.send(
      new DeleteCommand({
        TableName: FILES_TABLE,
        Key: { userId, fileId },
      })
    );

    res.json({ deleted: true });
  } catch (error) {
    console.error("delete file error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

app.listen(PORT, () => {
  console.log(`SecureVault backend running on port ${PORT}`);
});