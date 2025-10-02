from flask import Flask, request, jsonify
from openai import OpenAI

app = Flask(__name__)

client = OpenAI(api_key="YOUR_OPENAI_API_KEY")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_msg = data.get("message", "")

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # lightweight but powerful
        messages=[
            {"role": "system", "content": "You are a friendly health information assistant. Provide helpful, safe, and reliable health and wellness tips. Do NOT give medical diagnosis or prescriptions. Stick to general advice like diet, exercise, stress management, lifestyle improvements, and scientific facts."},
            {"role": "user", "content": user_msg}
        ]
    )

    reply = response.choices[0].message.content
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(port=5000, debug=True)
