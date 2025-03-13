from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

# Game state
game_state = {
    'players': {},
    'rooms': {},
    'next_player_id': 1
}

# Serve static files
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('join')
def handle_join(data):
    player_data = {
        'id': request.sid,
        'position': data['position'],
        'team': data['team']
    }
    emit('playerJoined', player_data, broadcast=True)

@socketio.on('tankMove')
def handle_tank_move(data):
    emit('tankMove', data, broadcast=True)

@socketio.on('tankFire')
def handle_tank_fire(data):
    emit('tankFire', data, broadcast=True)

@socketio.on('tankDestroyed')
def handle_tank_destroyed(data):
    emit('tankDestroyed', data, broadcast=True)

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')
    emit('playerLeft', request.sid, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=3000) 