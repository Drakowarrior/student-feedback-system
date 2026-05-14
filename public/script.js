const form = document.getElementById("feedbackForm");
const feedbackListDiv = document.getElementById("feedbackList");
const feedbackCountSpan = document.getElementById("feedbackCount");

const API_BASE = "/api/feedback";

function showToast(message, type = "success") {
    const existingToast = document.querySelector(".custom-toast");
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement("div");
    toast.className = `custom-toast toast-${type}`;
    
    let icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "warning") icon = "⚠️";
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.4rem;">${icon}</span>
            <span style="font-weight: 500;">${message}</span>
        </div>
    `;
    
    toast.style.position = "fixed";
    toast.style.bottom = "30px";
    toast.style.right = "20px";
    toast.style.backgroundColor = type === "error" ? "#fef2f2" : (type === "warning" ? "#fffbeb" : "#ecfdf5");
    toast.style.color = type === "error" ? "#b91c1c" : (type === "warning" ? "#b45309" : "#065f46");
    toast.style.borderLeft = `4px solid ${type === "error" ? "#ef4444" : (type === "warning" ? "#f59e0b" : "#10b981")}`;
    toast.style.padding = "14px 24px";
    toast.style.borderRadius = "60px";
    toast.style.boxShadow = "0 20px 25px -12px rgba(0,0,0,0.2)";
    toast.style.zIndex = "9999";
    toast.style.fontFamily = "'Inter', sans-serif";
    toast.style.fontWeight = "500";
    toast.style.backdropFilter = "blur(8px)";
    toast.style.background = "rgba(255,255,255,0.95)";
    toast.style.maxWidth = "320px";
    toast.style.fontSize = "0.9rem";
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function loadFeedbacks() {
    try {
        const response = await fetch(API_BASE);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const feedbacks = await response.json();
        
        if (!feedbacks || feedbacks.length === 0) {
            feedbackListDiv.innerHTML = `
                <div class="text-center py-5" style="background: rgba(255,255,255,0.7); border-radius: 40px; border: 1px dashed #cbd5e1;">
                    <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                    <p class="mb-0 text-muted">No feedback yet. Be the first to share!</p>
                </div>
            `;
            feedbackCountSpan.textContent = "0";
            return;
        }
        
        feedbackListDiv.innerHTML = "";
        feedbacks.forEach(feedback => {
            const card = createFeedbackCard(feedback);
            feedbackListDiv.appendChild(card);
        });
        
        feedbackCountSpan.textContent = feedbacks.length;
        
    } catch (error) {
        console.error("Error loading feedbacks:", error);
        feedbackListDiv.innerHTML = `
            <div class="alert alert-danger rounded-4 shadow-sm" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Failed to load feedbacks. Please refresh the page or check server connection.
            </div>
        `;
    }
}

function createFeedbackCard(item) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "feedback-card";
    cardDiv.setAttribute("data-id", item.id);
    
    const safeName = escapeHtml(item.name);
    const safeEmail = escapeHtml(item.email);
    const safeFeedback = escapeHtml(item.feedback);
    
    cardDiv.innerHTML = `
        <div class="feedback-name">
            <i class="fas fa-user-circle"></i> ${safeName}
        </div>
        <div class="feedback-email">
            <i class="fas fa-envelope"></i> ${safeEmail}
        </div>
        <div class="feedback-text">
            <i class="fas fa-quote-left me-2"></i> ${safeFeedback.replace(/\n/g, '<br>')}
        </div>
        <div class="button-group">
            <button class="btn btn-warning edit-btn" data-id="${item.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger delete-btn" data-id="${item.id}">
                <i class="fas fa-trash-alt"></i> Delete
            </button>
        </div>
    `;
    
    const editBtn = cardDiv.querySelector(".edit-btn");
    const deleteBtn = cardDiv.querySelector(".delete-btn");
    
    if (editBtn) {
        editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            editFeedback(item.id);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteFeedback(item.id);
        });
    }
    
    return cardDiv;
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return emailPattern.test(email);
}

form.addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const feedback = document.getElementById("feedback").value.trim();
    
    if (!name || !email || !feedback) {
        showToast("All fields are required!", "warning");
        return;
    }
    
    if (!isValidEmail(email)) {
        showToast("Please enter a valid email address!", "error");
        return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
    
    try {
        const response = await fetch(API_BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, feedback })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || "Failed to submit");
        }
        
        showToast("Feedback submitted successfully! 🎉", "success");
        form.reset();
        await loadFeedbacks();
        
    } catch (error) {
        console.error("Submit error:", error);
        showToast(error.message || "Something went wrong!", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

async function deleteFeedback(id) {
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    
    try {
        const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
        
        if (!response.ok) throw new Error("Delete failed");
        
        showToast("Feedback deleted successfully! 🗑️", "success");
        await loadFeedbacks();
        
    } catch (error) {
        showToast("Error deleting feedback!", "error");
    }
}

async function editFeedback(id) {
    const newName = prompt("Enter new name:");
    if (!newName) return;
    
    const newEmail = prompt("Enter new email:");
    if (!newEmail) return;
    
    const newFeedback = prompt("Enter new feedback:");
    if (!newFeedback) return;
    
    if (!isValidEmail(newEmail)) {
        showToast("Invalid email format!", "error");
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName, email: newEmail, feedback: newFeedback })
        });
        
        if (!response.ok) throw new Error("Update failed");
        
        showToast("Feedback updated successfully! ✏️", "success");
        await loadFeedbacks();
        
    } catch (error) {
        showToast("Error updating feedback!", "error");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadFeedbacks();
});