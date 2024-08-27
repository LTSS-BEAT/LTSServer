import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# 데이터베이스 연결 및 데이터 불러오기
load_dotenv()

def initialize_database_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv('RDS_HOST'),
            database=os.getenv('RDS_DB_ML'),
            user=os.getenv('RDS_USER'),
            password=os.getenv('RDS_PASSWORD')
        )
        if connection.is_connected():
            print("MySQL connected")
            return connection
    except Error as e:
        print(f"mysql connection error: {e}")
        return None

def fetch_data_from_db(connection):
    cursor = connection.cursor(dictionary=True)
    query = "SELECT * FROM data"
    cursor.execute(query)
    records = cursor.fetchall()
    return pd.DataFrame(records)

connection = initialize_database_connection()
if connection:
    data = fetch_data_from_db(connection)
    print('Data loaded successfully, mysql connection closed')
    connection.close()

# 결측치가 있는 행 제거
data.dropna(inplace=True)
print(f'Data after dropping rows with null values: {len(data)} rows')

# 정규화 범위 설정
y_min, y_max = 34.3, 38.4
x_min, x_max = 126.1, 129.55
duration_min, duration_max = 0, 100000

# 좌표 및 시간을 스케일링
coordinate_columns = [col for col in data.columns if col.startswith(('dep_', 'dest_', 'x', 'y'))]
for col in coordinate_columns:
    if 'x' in col:
        data[col] = (data[col].astype(float) - x_min) / (x_max - x_min)
    elif 'y' in col:
        data[col] = (data[col].astype(float) - y_min) / (y_max - y_min)

# Duration 및 d 값 정규화
time_columns = [col for col in data.columns if col.startswith('d') or col == 'duration']
data[time_columns] = (data[time_columns].astype(float) - duration_min) / (duration_max - duration_min)
print('Data after scaling:')

# RNN을 위한 순차 데이터 구성
def preprocess_data(df):
    all_sequences = []
    all_durations = []
    for _, row in df.iterrows():
        dep_x, dep_y, dest_x, dest_y = row['dep_x'], row['dep_y'], row['dest_x'], row['dest_y']
        waypoints = [(row[f'x{i}'], row[f'y{i}'], row[f'd{i}']) for i in range(1, 51)]
        
        sequences = []
        for i, (x, y, duration) in enumerate(waypoints):
            if x == 0 and y == 0:  # 중간 경로가 없는 경우, 스킵
                continue
            
            current_seq = []
            if i == 0:
                current_seq.append([dep_x, dep_y, x, y])
            else:
                current_seq.append([waypoints[i-1][0], waypoints[i-1][1], x, y])
                
            current_seq.append([x, y, x, y])  # 현재 경로에서 현재 경로까지
            
            sequences.append(current_seq)
            all_durations.append(duration)
        
        all_sequences.extend(sequences)
    
    return np.array(all_sequences), np.array(all_durations)

# 데이터 전처리
X, y = preprocess_data(data)

# 학습, 검증, 테스트 데이터로 분할
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.3, random_state=42)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)

print(f"Training data shape: {X_train.shape}, Validation data shape: {X_val.shape}, Test data shape: {X_test.shape}")

# 첫 번째 샘플 출력
print("First training sample:")
print(X_train[0])
