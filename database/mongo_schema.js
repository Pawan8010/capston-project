// MongoDB Schema - Livestock AI System

// Users Collection
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["uid", "email"],
      properties: {
        uid: { bsonType: "string" },
        email: { bsonType: "string" },
        displayName: { bsonType: "string" },
        role: { bsonType: "string", enum: ["farmer", "admin"] },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

// Predictions Collection
db.createCollection("predictions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["uid", "result"],
      properties: {
        uid: { bsonType: "string" },
        result: { bsonType: "object" },
        created_at: { bsonType: "date" }
      }
    }
  }
});

db.predictions.createIndex({ uid: 1, created_at: -1 });
