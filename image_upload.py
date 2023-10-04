import base64
import requests
import sys

def encode_image_to_base64(file_path):
    try:
        with open(file_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except FileNotFoundError:
        return None

def upload_image_to_server(file_path, token, parent_id):
    file_name = file_path.split('/')[-1]
    file_encoded = encode_image_to_base64(file_path)

    if file_encoded is None:
        print("File not found.")
        return

    headers = {'X-Token': token}
    data = {
        'name': file_name,
        'type': 'image',
        'isPublic': True,
        'data': file_encoded,
        'parentId': parent_id
    }

    try:
        response = requests.post("http://0.0.0.0:5000/files", json=data, headers=headers)
        if response.status_code == 200:
            print(response.json())
        else:
            print(f"Failed to upload image. Status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python script.py <file_path> <token> <parent_id>")
    else:
        file_path = sys.argv[1]
        token = sys.argv[2]
        parent_id = sys.argv[3]
        upload_image_to_server(file_path, token, parent_id)

