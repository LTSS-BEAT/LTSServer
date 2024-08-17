import os
from dotenv import load_dotenv
load_dotenv()
import mysql.connector
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense


# 1. 데이터베이스 연결 설정
def initialize_database_connection():
    global connection, cursor
    try:
        connection = mysql.connector.connect(
            host=os.getenv('RDS_HOST'),
            database='map_db',
            user=os.getenv('RDS_USER'),
            password=os.getenv('RDS_PASSWORD')
        )
        
        if connection.is_connected():
            print("MySQL 연결 성공")
            cursor = connection.cursor()
        else:
            print("MySQL 연결 실패")
    
    except mysql.connector.Error as e:
        print(f"데이터베이스 연결 오류: {e}")
        cursor = None

# 2. 데이터베이스에서 데이터 읽기
def fetch_data_from_db():
    if cursor is None:
        raise Exception("데이터베이스 커서가 정의되지 않았습니다.")
    
    query = "SELECT dep_x, dep_y, dest_x, dest_y, duration FROM data"
    cursor.execute(query)
    rows = cursor.fetchall()
    
    df = pd.DataFrame(rows, columns=['dep_x', 'dep_y', 'dest_x', 'dest_y', 'duration'])
    return df

# 3. 데이터 전처리
def preprocess_data(df):
    # 데이터 타입 변환
    df['dep_x'] = df['dep_x'].astype(float)
    df['dep_y'] = df['dep_y'].astype(float)
    df['dest_x'] = df['dest_x'].astype(float)
    df['dest_y'] = df['dest_y'].astype(float)
    
    # 입력 특성(X)과 목표 변수(y) 분리
    X = df[['dep_x', 'dep_y', 'dest_x', 'dest_y']].values
    y = df['duration'].values
    
    # 학습 데이터와 테스트 데이터로 분할
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 수동으로 정의된 최소 및 최대값
    min_values = np.array([126.1, 34.3, 126.1, 34.3])
    max_values = np.array([129.55, 38.4, 129.55, 38.4])

    # Min-Max 정규화 수행 (입력 데이터)
    X_train = (X_train - min_values) / (max_values - min_values)
    X_test = (X_test - min_values) / (max_values - min_values)
    
    # 출력 데이터 정규화
    y_min = 0     # 주어진 duration의 최소값
    y_max = 100000 # 주어진 duration의 최대값
    y_train = (y_train - y_min) / (y_max - y_min)
    y_test = (y_test - y_min) / (y_max - y_min)
    
    return X_train, X_test, y_train, y_test, y_min, y_max

# 4. 모델 생성
def create_model():
    model = Sequential()
    model.add(Dense(64, input_dim=4, activation='relu'))
    model.add(Dense(32, activation='relu'))
    model.add(Dense(1))  # 출력층은 회귀 문제이므로 활성화 함수 없음
    
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

# 5. 모델 저장
def save_model(model, filename="model.h5"):
    model.save(filename)
    print(f"모델이 {filename} 파일로 저장되었습니다.")

# 6. 모델 불러오기
def load_existing_model(filename="model.h5"):
    model = load_model(filename)
    print(f"모델이 {filename} 파일에서 불러와졌습니다.")
    return model

# 7. 메인 실행 함수
def main(save_model_flag=True, load_model_flag=False):
    initialize_database_connection()
    
    if cursor is None:
        print("데이터베이스 연결에 실패했습니다. 프로그램을 종료합니다.")
        return
    
    df = fetch_data_from_db()
    X_train, X_test, y_train, y_test, y_min, y_max = preprocess_data(df)
    
    if load_model_flag:
        model = load_existing_model("model.h5")
    else:
        model = create_model()
    
    model.fit(X_train, y_train, epochs=30, batch_size=32, validation_split=0.2)
    
    loss, mae = model.evaluate(X_test, y_test)
    
    # 원래 스케일로 변환
    loss_original = loss * (y_max - y_min) ** 2
    mae_original = mae * (y_max - y_min)
    
    print(f"정규화된 테스트 손실: {loss}, 테스트 MAE: {mae}")
    print(f"원래 스케일의 테스트 손실: {loss_original}, 테스트 MAE: {mae_original}")
    
    if save_model_flag:
        save_model(model, "model.h5")
    
    if connection.is_connected():
        cursor.close()
        connection.close()
        print("MySQL 연결 종료")

if __name__ == "__main__":
    main(save_model_flag=True, load_model_flag=False)
