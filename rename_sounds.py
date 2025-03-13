import os

# Thư mục chứa các file âm thanh
SOUND_DIR = 'assets/sounds'

# Mapping tên file cũ sang tên file mới
RENAME_MAP = {
    '182794__qubodup__rocket-launch.flac': 'bomb_explosion.mp3',
    '270528__littlerobotsoundfactory__jingle_win_00.wav': 'bomb_tick.mp3'
}

def rename_files():
    for old_name, new_name in RENAME_MAP.items():
        old_path = os.path.join(SOUND_DIR, old_name)
        new_path = os.path.join(SOUND_DIR, new_name)
        
        if os.path.exists(old_path):
            try:
                os.rename(old_path, new_path)
                print(f'Đã đổi tên: {old_name} -> {new_name}')
            except Exception as e:
                print(f'Lỗi khi đổi tên {old_name}: {str(e)}')
        else:
            print(f'Không tìm thấy file: {old_name}')

if __name__ == '__main__':
    rename_files() 