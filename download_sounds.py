import os
import requests
from urllib.parse import urljoin

# Tạo thư mục nếu chưa tồn tại
SOUND_DIR = 'assets/sounds'
os.makedirs(SOUND_DIR, exist_ok=True)

# Base URL cho các file âm thanh từ GitHub
BASE_URL = "https://raw.githubusercontent.com/nicolasdnm/fps-assets/master/sounds/"

# Danh sách các file âm thanh cần tải
SOUND_FILES = {
    'tank_move.mp3': BASE_URL + 'vehicle_move.mp3',
    'tank_fire.mp3': BASE_URL + 'shoot.mp3',
    'bullet_hit.mp3': BASE_URL + 'hit.mp3',
    'low_health.mp3': BASE_URL + 'low_health.mp3',
    'bomb_tick.mp3': BASE_URL + 'bomb_tick.mp3',
    'bomb_explosion.mp3': BASE_URL + 'explosion.mp3'
}

def download_file(url, filename):
    try:
        print(f'Đang tải {filename} từ {url}...')
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        filepath = os.path.join(SOUND_DIR, filename)
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        print(f'Đã tải thành công: {filename}')
        return True
    except Exception as e:
        print(f'Lỗi khi tải {filename}: {str(e)}')
        return False

def main():
    print('Bắt đầu tải các file âm thanh...')
    success_count = 0
    for filename, url in SOUND_FILES.items():
        if download_file(url, filename):
            success_count += 1
    print(f'Hoàn thành! Đã tải thành công {success_count}/{len(SOUND_FILES)} file âm thanh.')

if __name__ == '__main__':
    main() 