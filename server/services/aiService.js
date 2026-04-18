const { getDB } = require("../config/db");
const { ObjectId } = require("mongodb");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY);

let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const generateAIResponse = async (postId, question) => {
  const db = getDB();

  try {
    const modelNames = ["gemini-2.5-flash"];
    let aiAnswer = null;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(
          `Explain this in very simple terms like you're explaining to a 5-year-old child. Use simple words and fun examples. Keep it friendly and easy to understand:\n\n${question}`
        );
        aiAnswer = result.response.text();
        console.log(`AI Response generated using ${modelName}`);
        break;
      } catch (err) {
        console.log(`Model ${modelName} failed, trying next...`);
      }
    }

    if (!aiAnswer) {
      throw new Error("No AI model available");
    }

    const aiComment = {
      postId: new ObjectId(postId),
      userId: null,
      authorName: "🤖 ELI5 AI Assistant",
      content: aiAnswer,
      isAI: true,
      parentId: null,
      mentions: [],
      metrics: { upvotes: 0, downvotes: 0 },
      isAccepted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("comments").insertOne(aiComment);
    aiComment._id = result.insertedId;

    await db.collection("posts").updateOne(
      { _id: new ObjectId(postId) },
      {
        $set: { aiResponseStatus: "generated" },
        $inc: { "metrics.totalAnswers": 1 },
      }
    );

    if (ioInstance) {
      ioInstance.to(`post_${postId}`).emit("new-ai-answer", {
        postId: postId,
        comment: aiComment,
      });

      ioInstance.to(`post_${postId}`).emit("answer-count-updated", {
        postId: postId,
        totalAnswers: 1,
      });
    }

    console.log(`AI response generated for post ${postId}`);
  } catch (error) {
    console.error("Gemini AI Error: ", error);

    try {
      await db
        .collection("posts")
        .updateOne(
          { _id: new ObjectId(postId) },
          { $set: { aiResponseStatus: "failed" } }
        );
    } catch (dbError) {
      console.error("Failed to update post status:", dbError);
    }
  }
};

module.exports = { generateAIResponse, setIO };
