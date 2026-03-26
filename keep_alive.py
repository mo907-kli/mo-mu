from flask import Flask
from threading import Thread
import os

app = Flask(__name__)

@app.route('/')
def home():
    return "عمي mo.. البوت شغال باحترافية 24/7!"

def run():
    # Render يعطي البورت تلقائياً، وإذا ما لقاه يستخدم 8080
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)

def keep_alive():
    t = Thread(target=run)
    t.start()
