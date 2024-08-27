import os
import pandas as pd
import numpy as np
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.losses import MeanSquaredError
from tensorflow.keras import regularizers

from sklearn.metrics import mean_squared_error, mean_absolute_error
from datetime import datetime

load_dotenv()

# 데이터베이스 연결
def initialize_database_connection():
    connection = None
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
    return connection

# 데이터베이스에서 데이터 불러오기
def fetch_data_from_db(cursor):
    query = "SELECT * FROM data"
    cursor.execute(query)
    records = cursor.fetchall()
    return records

# 데이터 전처리
def preprocess_data(records):
    processed_data = []
    for row in records:
        dep_x, dep_y, dest_x, dest_y, duration = row[1:6]
        
        # null 값을 가지는 데이터는 스킵
        if None in [dep_x, dep_y, dest_x, dest_y, duration]:
            continue
        
        # 첫 번째 기록 (dep_x, dep_y -> dest_x, dest_y)
        processed_data.append([float(dep_x), float(dep_y), float(dest_x), float(dest_y), int(duration)])

        # 추가 경로 처리 (xn, yn, dn)
        for i in range(6, len(row), 3):
            xn, yn, dn = row[i:i+3]
            if xn is not None and yn is not None and dn is not None:
                processed_data.append([float(dep_x), float(dep_y), float(xn), float(yn), int(dn)])
    
    return processed_data

# 데이터셋 준비 및 스케일링
def prepare_dataset(df):
    X = df[['a', 'b', 'c', 'd']].values
    y = df['e'].values
    
    # 입력 데이터 정규화 (Min-Max)
    input_scaler = MinMaxScaler(feature_range=(0, 1))
    input_scaler.fit([[126.1, 34.3, 126.1, 34.3], [129.55, 38.4, 129.55, 38.4]])
    X_scaled = input_scaler.transform(X)
    
    # 출력 데이터 정규화
    y_min, y_max = y.min(), y.max()
    output_scaler = MinMaxScaler(feature_range=(0, 1))
    output_scaler.fit([[y_min], [y_max]])
    y_scaled = output_scaler.transform(y.reshape(-1, 1)).flatten()
    
    return train_test_split(X_scaled, y_scaled, test_size=0.2, random_state=42), output_scaler

# 딥러닝 모델 생성 (드롭아웃 적용)
def create_model(input_shape):
    model = Sequential([
        Dense(32, input_shape=input_shape, activation='relu', kernel_initializer=regularizers.l1(0.01)),
        # Dropout(0.2),  # 드롭아웃 추가
        Dense(64, activation='relu', kernel_initializer=regularizers.l1(0.01)),
        # Dropout(0.2),  # 드롭아웃 추가
        Dense(1)  # 출력층
    ])
    
    model.compile(optimizer=Adam(learning_rate=0.001),
                  loss=MeanSquaredError(),
                  metrics=['mean_squared_error'])
    return model

# 모델 저장 함수
def save_model(model, file_path):
    model.save(file_path, include_optimizer=False)
    print(f"Model saved to {file_path}")

# 주 함수
def main():
    # 데이터베이스 연결 및 데이터 로드
    connection = initialize_database_connection()
    if connection:
        cursor = connection.cursor()
        records = fetch_data_from_db(cursor)
        cursor.close()
        connection.close()

        # 데이터 전처리
        dataset = preprocess_data(records)
        
        # 데이터프레임으로 변환 (Pandas)
        df = pd.DataFrame(dataset, columns=['a', 'b', 'c', 'd', 'e'])

        # 데이터셋 준비 및 정규화
        (X_train, X_test, y_train, y_test), output_scaler = prepare_dataset(df)

        # 모델 생성
        model = create_model((X_train.shape[1],))
        
        # 모델 학습
        model.fit(X_train, y_train, epochs=5, batch_size=64, validation_split=0.2, shuffle=True)

        # 모델 평가
        loss, mae = model.evaluate(X_test, y_test)
        print(f"Test Loss: {loss}, Test MAE: {mae}")

        # 모델 저장
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        model_filename = f'ML_MAP\regression_model_{timestamp}.keras'

        # 모델 저장
        model.save(model_filename)

        # 예측 테스트
        predictions_scaled = model.predict(X_test)
        predictions = output_scaler.inverse_transform(predictions_scaled)  # 역정규화
        y_test_original = output_scaler.inverse_transform(y_test.reshape(-1, 1))  # 역정규화
        
        # 역정규화된 오차 계산
        mse = mean_squared_error(y_test_original, predictions)
        mae = mean_absolute_error(y_test_original, predictions)
        
        print(f"Mean Squared Error (MSE) on original scale: {mse}")
        print(f"Mean Absolute Error (MAE) on original scale: {mae}")

if __name__ == "__main__":
    main()
