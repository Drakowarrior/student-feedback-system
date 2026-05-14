const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, "feedbacks.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

let feedbacks = [];

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, "utf8");
            feedbacks = JSON.parse(data);
            console.log(`✅ Loaded ${feedbacks.length} feedbacks from database`);
        } else {
            feedbacks = [];
            console.log("📁 Created new feedback database");
            saveData();
        }
    } catch (error) {
        console.error("❌ Error loading data:", error.message);
        feedbacks = [];
    }
}

function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(feedbacks, null, 2));
        console.log(`💾 Saved ${feedbacks.length} feedbacks to database`);
    } catch (error) {
        console.error("❌ Error saving data:", error.message);
    }
}

loadData();

app.get("/api/feedback", (req, res) => {
    console.log(`📖 GET /api/feedback - Returning ${feedbacks.length} feedbacks`);
    res.json(feedbacks);
});

app.post("/api/feedback", (req, res) => {
    console.log("📨 POST request received to /api/feedback");
    console.log("Request body:", req.body);
    
    const { name, email, feedback } = req.body;

    if (!name || !email || !feedback) {
        console.log("⚠️ Validation failed: Missing fields");
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    const emailPattern = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailPattern.test(email)) {
        console.log(`⚠️ Invalid email: ${email}`);
        return res.status(400).json({
            success: false,
            message: "Invalid email format"
        });
    }

    const newFeedback = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim(),
        feedback: feedback.trim(),
        createdAt: new Date().toISOString()
    };

    feedbacks.unshift(newFeedback);
    saveData();

    console.log("\n✨ NEW FEEDBACK SUBMITTED ✨");
    console.log("━".repeat(50));
    console.log(`📝 ID:       ${newFeedback.id}`);
    console.log(`👤 Name:     ${newFeedback.name}`);
    console.log(`📧 Email:    ${newFeedback.email}`);
    console.log(`💬 Feedback: ${newFeedback.feedback}`);
    console.log(`📅 Time:     ${newFeedback.createdAt}`);
    console.log("━".repeat(50));
    console.log(`📊 Total feedbacks: ${feedbacks.length}\n`);

    res.status(201).json({
        success: true,
        message: "Feedback added successfully",
        data: newFeedback
    });
});

app.put("/api/feedback/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const { name, email, feedback } = req.body;

    const index = feedbacks.findIndex(item => item.id === id);

    if (index === -1) {
        console.log(`⚠️ PUT /api/feedback/${id} - Feedback not found`);
        return res.status(404).json({
            success: false,
            message: "Feedback not found"
        });
    }

    console.log(`✏️ Updating feedback ID: ${id}`);
    console.log(`   Old name: ${feedbacks[index].name}`);
    console.log(`   Old email: ${feedbacks[index].email}`);

    if (name && name.trim()) {
        feedbacks[index].name = name.trim();
    }
    if (email && email.trim()) {
        const emailPattern = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        if (!emailPattern.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }
        feedbacks[index].email = email.trim();
    }
    if (feedback && feedback.trim()) {
        feedbacks[index].feedback = feedback.trim();
    }
    
    feedbacks[index].updatedAt = new Date().toISOString();

    console.log(`   New name: ${feedbacks[index].name}`);
    console.log(`   New email: ${feedbacks[index].email}`);
    
    saveData();

    res.json({
        success: true,
        message: "Feedback updated successfully",
        data: feedbacks[index]
    });
});

app.delete("/api/feedback/:id", (req, res) => {
    const id = parseInt(req.params.id);

    const index = feedbacks.findIndex(item => item.id === id);

    if (index === -1) {
        console.log(`⚠️ DELETE /api/feedback/${id} - Feedback not found`);
        return res.status(404).json({
            success: false,
            message: "Feedback not found"
        });
    }

    const deleted = feedbacks[index];
    console.log(`🗑️ DELETED FEEDBACK`);
    console.log(`   ID: ${deleted.id}`);
    console.log(`   Name: ${deleted.name}`);
    console.log(`   Email: ${deleted.email}`);
    
    feedbacks.splice(index, 1);
    saveData();
    
    console.log(`   Remaining feedbacks: ${feedbacks.length}\n`);

    res.json({
        success: true,
        message: "Feedback deleted successfully"
    });
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log(`║   🚀 SERVER RUNNING ON http://localhost:${PORT}   ║`);
    console.log("║   📝 Student Feedback System Active              ║");
    console.log("║   💾 Data persists in feedbacks.json             ║");
    console.log("║   🎯 Open your browser to get started!          ║");
    console.log("╚══════════════════════════════════════════════════╝\n");
});