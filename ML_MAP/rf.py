from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

import random
import requests
import os
from dotenv import load_dotenv
load_dotenv()

import mysql.connector
from mysql.connector import Error
import os

# 반복
ITERATION_NUM = 9800

# 전역 데이터베이스 연결 변수
connection = None
cursor = None

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
            print("MySQL connected")
            cursor = connection.cursor()
    
    except Error as e:
        print(f"mysql connection error: {e}")

def close_database_connection():
    global connection, cursor
    if connection and connection.is_connected():
        cursor.close()
        connection.close()
        print("MySQL connection closed")


def fetch_data():
    global cursor
    query_included = "SELECT x, y FROM included"
    query_excluded = "SELECT x, y FROM excluded"

    cursor.execute(query_included)
    included_data = cursor.fetchall()

    cursor.execute(query_excluded)
    excluded_data = cursor.fetchall()

    return included_data, excluded_data


def preprocess_data(included_data, excluded_data):
    X = []
    y = []

    for data in included_data:
        X.append([float(data[0]), float(data[1])])
        y.append(1)  # included는 1로 라벨링

    for data in excluded_data:
        X.append([float(data[0]), float(data[1])])
        y.append(0)  # excluded는 0으로 라벨링

    return X, y


def train_model(X, y):
    # 데이터를 학습용과 테스트용으로 분리
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 랜덤 포레스트 모델 초기화 및 학습
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # 테스트 데이터로 예측 수행
    y_pred = model.predict(X_test)

    # 모델 정확도 출력
    accuracy = accuracy_score(y_test, y_pred)
    print(f"random forest model accuracy: {accuracy:.2f}")

    return model


def predict(model, x, y):
    return model.predict([[float(x), float(y)]])[0]


def update_model():
    print('-' * 50)

    included_data, excluded_data = fetch_data()
    X, y = preprocess_data(included_data, excluded_data)
    model = train_model(X, y)

    print('random forest model updated!')

    return model


def insert_map_data(data):
    global cursor, connection
    try:
        # 데이터 삽입 쿼리
        insert_query = f"""
            INSERT INTO data (dep_x, dep_y, dest_x, dest_y, duration)
            VALUES (%s, %s, %s, %s, %s)
        """
        
        # 데이터 삽입
        cursor.execute(insert_query, data)
        
        # 변경 사항 커밋
        connection.commit()
    
    except Error as e:
        print(f"데이터 삽입 오류: {e}")


def insert_excluded_data(data):
    global cursor, connection
    try:
        # 데이터 삽입 쿼리
        insert_query = f"""
            INSERT INTO excluded (x, y)
            VALUES (%s, %s)
        """
        
        # 데이터 삽입
        cursor.execute(insert_query, data)
        
        # 변경 사항 커밋
        connection.commit()
    
    except Error as e:
        print(f"excluded insert failed!: {e}")
        

def insert_included_data(data):
    global cursor, connection
    try:
        # 데이터 삽입 쿼리
        insert_query = f"""
            INSERT INTO included (x, y)
            VALUES (%s, %s)
        """
        
        # 데이터 삽입
        cursor.execute(insert_query, data)
        
        # 변경 사항 커밋
        connection.commit()
    
    except Error as e:
        print(f"included insert failed!: {e}")



def get_duration(dep_lon, dep_lat, dest_lon, dest_lat):
    # Kakao Mobility API의 기본 URL
    url = 'https://apis-navi.kakaomobility.com/v1/directions'
    
    # 요청 파라미터 설정
    params = {
        'origin': f'{dep_lon},{dep_lat}',
        'destination': f'{dest_lon},{dest_lat}',
    }
    
    # 요청 헤더 설정
    headers = {
        'Authorization': f'KakaoAK {os.getenv("KAKAO_REST_API_KEY")}',
        'Content-Type': 'application/json',
    }
    
    response = None  # Initialize response to handle errors
    
    try:
        # GET 요청 보내기
        response = requests.get(url, params=params, headers=headers)
        
        # 요청이 성공적으로 완료되었는지 확인
        response.raise_for_status()
        
        # 응답 JSON 파싱
        data = response.json()

        # 결과 메시지에 따라 분기 처리
        if 'result_msg' in data['routes'][0]:
            msg = data['routes'][0]['result_msg']
            if msg == '도착 지점 주변의 도로를 탐색할 수 없음':
                excluded_data = (dest_lon, dest_lat)
                insert_excluded_data(excluded_data)
                print(f"excluded data: {excluded_data}")

            elif msg == '시작 지점 주변의 도로를 탐색할 수 없음':
                excluded_data = (dep_lon, dep_lat)
                insert_excluded_data(excluded_data)
                print(f"excluded data: {excluded_data}")
        
        # duration 추출
        try:
            duration = data['routes'][0]['summary']['duration']
            return duration
        except (KeyError, IndexError) as e:
            return None
    
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP 오류 발생: {http_err}")
        if response is not None:
            print("응답 상태 코드:", response.status_code)
            print("응답 본문:", response.text)
        else:
            print("응답 객체가 정의되지 않았습니다.")
    
    except Exception as err:
        print(f"기타 오류 발생: {err}")
        if response is not None:
            print("응답 본문:", response.text)
            

def generate_random_coordinates():
    # 한계 범위
    y_min, y_max = 34.3, 38.4
    x_min, x_max = 126.1, 129.55
    
    # 랜덤한 y와 x 값 생성
    y = round(random.uniform(y_min, y_max), 2)
    x = round(random.uniform(x_min, x_max), 2)

    prediction = predict(model, x, y)
    if (prediction == 0):
        print("random forest model: excluded!")
        x, y = generate_random_coordinates()
    
    return (x, y)


# 메인 코드
initialize_database_connection()

model = update_model()

for i in range(ITERATION_NUM):
    print('-------------------------------------------------')
    print(f"iteration {i+1}/{ITERATION_NUM}")
    dep_lon, dep_lat = generate_random_coordinates()
    dest_lon, dest_lat = generate_random_coordinates()

    duration = get_duration(dep_lon, dep_lat, dest_lon, dest_lat)

    if duration:
        data_to_insert = (dep_lon, dep_lat, dest_lon, dest_lat, duration)
        insert_map_data(data_to_insert)
        insert_included_data((dep_lon, dep_lat))
        insert_included_data((dest_lon, dest_lat))
        print(f"input data: {data_to_insert}")

    if i % 1000 == 999:
        model = update_model()

close_database_connection()



