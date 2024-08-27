from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score

from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

import numpy as np


import math
import random
import requests
import os
import time
import joblib
from dotenv import load_dotenv
load_dotenv()

import mysql.connector
from mysql.connector import Error


# 전역 변수
THRESHOLD = 0.44
ITERATION_NUM = 10000
MODEL_PATH = "ML_MAP\classification_model\cord_classification_model.pkl"  # 모델 파일 경로

def load_trained_model():
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print('=' * 50)
        print(f"Model loaded from {MODEL_PATH}")
        return model
    else:
        raise ValueError("cord classification model is not loaded.")
        return None

def predict(model, x, y):
    # 새 데이터 포인트의 확률 예측
    y_proba_new = model.predict_proba([[x, y]])[:, 1]
    
    # 설정된 스레숄드로 이진 예측
    prediction = (y_proba_new >= THRESHOLD).astype(int)
    
    return prediction[0]


# 전역 데이터베이스 연결 변수
connection = None
cursor = None

def initialize_database_connection():
    global connection, cursor

    print('=' * 50)
    try:
        connection = mysql.connector.connect(
            host=os.getenv('RDS_HOST'),
            database=os.getenv('RDS_DB_ML'),
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


# def fetch_data():
#     global cursor
#     query_included = "SELECT x, y FROM included"
#     query_excluded = "SELECT x, y FROM excluded"

#     cursor.execute(query_included)
#     included_data = cursor.fetchall()

#     cursor.execute(query_excluded)
#     excluded_data = cursor.fetchall()

#     return included_data, excluded_data


# def preprocess_data(included_data, excluded_data):
#     X = []
#     y = []

#     for data in included_data:
#         X.append([float(data[0]), float(data[1])])
#         y.append(1)  # included는 1로 라벨링

#     for data in excluded_data:
#         X.append([float(data[0]), float(data[1])])
#         y.append(0)  # excluded는 0으로 라벨링

#     return X, y


# def train_model(X, y):
#     # 데이터를 학습용과 테스트용으로 분리
#     X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

#     # 랜덤 포레스트 모델 초기화 및 학습
#     model = RandomForestClassifier(n_estimators=50, random_state=42)
#     model.fit(X_train, y_train)

#     # 테스트 데이터로 예측 수행
#     y_proba = model.predict_proba(X_test)[:, 1]
#     y_pred = (y_proba >= THRESHOLD).astype(int)  # 전역 threshold 기준을 사용

#     # 모델 성능 출력
#     accuracy = accuracy_score(y_test, y_pred)
#     precision = precision_score(y_test, y_pred)
#     recall = recall_score(y_test, y_pred)
#     print(f"Model accuracy: {accuracy:.3f}")
#     print(f"Model precision: {precision:.3f}")
#     print(f"Model recall: {recall:.3f}")

#     return model


# def predict(model, x, y):
#     proba = model.predict_proba([[float(x), float(y)]])[0][1]
#     return 1 if proba >= THRESHOLD else 0  # 전역 threshold 사용하여 예측



# def update_model():
#     print('=' * 50)

#     included_data, excluded_data = fetch_data()
#     X, y = preprocess_data(included_data, excluded_data)
#     model = train_model(X, y)

#     print('random forest model updated!')

#     return model


def insert_map_data(dep_lon, dep_lat, dest_lon, dest_lat, duration, route):
    global cursor, connection
    try:
        # 데이터 삽입 쿼리
        insert_query = """
            INSERT INTO data (
                dep_x, dep_y, dest_x, dest_y, duration,
                x1, y1, d1, x2, y2, d2, x3, y3, d3,
                x4, y4, d4, x5, y5, d5, x6, y6, d6,
                x7, y7, d7, x8, y8, d8, x9, y9, d9,
                x10, y10, d10, x11, y11, d11, x12, y12, d12,
                x13, y13, d13, x14, y14, d14, x15, y15, d15,
                x16, y16, d16, x17, y17, d17, x18, y18, d18,
                x19, y19, d19, x20, y20, d20, x21, y21, d21,
                x22, y22, d22, x23, y23, d23, x24, y24, d24,
                x25, y25, d25, x26, y26, d26, x27, y27, d27,
                x28, y28, d28, x29, y29, d29, x30, y30, d30,
                x31, y31, d31, x32, y32, d32, x33, y33, d33,
                x34, y34, d34, x35, y35, d35, x36, y36, d36,
                x37, y37, d37, x38, y38, d38, x39, y39, d39,
                x40, y40, d40, x41, y41, d41, x42, y42, d42,
                x43, y43, d43, x44, y44, d44, x45, y45, d45,
                x46, y46, d46, x47, y47, d47, x48, y48, d48,
                x49, y49, d49, x50, y50, d50
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        # 최대 50개의 좌표만 랜덤으로 선택
        max_points = 50
        if len(route) > max_points:
            # 랜덤하게 50개 좌표 선택
            selected_route = random.sample(route, max_points)
        else:
            selected_route = route

        # 선택된 좌표 세트를 평탄화하여 데이터 준비
        flat_route = [item for sublist in selected_route for item in sublist]

        # 부족한 부분을 None으로 채우기
        needed_length = max_points * 3  # 50개 좌표, 각 좌표마다 (x, y, d) = 150개 값
        if len(flat_route) < needed_length:
            flat_route += [None] * (needed_length - len(flat_route))
        
        # 데이터 튜플로 변환
        values = (dep_lon, dep_lat, dest_lon, dest_lat, duration) + tuple(flat_route)

        # 데이터 삽입
        cursor.execute(insert_query, values)
        
        # 변경 사항 커밋
        connection.commit()
    
    except Error as e:
        print(f"데이터 삽입 오류: {e}")
        connection.rollback()  # 에러 발생 시 롤백


def insert_excluded_data(data):
    global cursor, connection#, excluded
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
        # excluded.append(data)
    
    except Error as e:
        print(f"excluded insert failed!")
        

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
        print(f"included insert failed!")



# def get_duration(dep_lon, dep_lat, dest_lon, dest_lat):
#     # Kakao Mobility API의 기본 URL
#     url = 'https://apis-navi.kakaomobility.com/v1/directions'
    
#     # 요청 파라미터 설정
#     params = {
#         'origin': f'{dep_lon},{dep_lat}',
#         'destination': f'{dest_lon},{dest_lat}',
#     }
    
#     # 요청 헤더 설정
#     headers = {
#         'Authorization': f'KakaoAK {os.getenv("KAKAO_REST_API_KEY")}',
#         'Content-Type': 'application/json',
#     }
    
#     response = None  # Initialize response to handle errors
    
#     try:
#         # GET 요청 보내기
#         response = requests.get(url, params=params, headers=headers)
        
#         # 요청이 성공적으로 완료되었는지 확인
#         response.raise_for_status()
        
#         # 응답 JSON 파싱
#         data = response.json()

#         # 결과 메시지에 따라 분기 처리
#         if 'result_msg' in data['routes'][0]:
#             msg = data['routes'][0]['result_msg']
#             if msg == '도착 지점 주변의 도로를 탐색할 수 없음':
#                 excluded_data = (dest_lon, dest_lat)
#                 insert_excluded_data(excluded_data)
#                 print(f"excluded data: {excluded_data}")

#             elif msg == '시작 지점 주변의 도로를 탐색할 수 없음':
#                 excluded_data = (dep_lon, dep_lat)
#                 insert_excluded_data(excluded_data)
#                 print(f"excluded data: {excluded_data}")
        
#         # duration 추출
#         try:
#             duration = data['routes'][0]['summary']['duration']
#             return duration
#         except (KeyError, IndexError) as e:
#             return None
    
#     except requests.exceptions.HTTPError as http_err:
#         print(f"HTTP 오류 발생: {http_err}")
#         if response is not None:
#             print("응답 상태 코드:", response.status_code)
#             print("응답 본문:", response.text)
#         else:
#             print("응답 객체가 정의되지 않았습니다.")
    
#     except Exception as err:
#         print(f"기타 오류 발생: {err}")
#         if response is not None:
#             print("응답 본문:", response.text)



def get_data(dep_lon, dep_lat, dest_lon, dest_lat):
    
    # 조건 함수: name이 주어진 문자열로 끝나는지 검사
    def name_condition(name):
        if not name:
            return False
        # 조건 리스트
        conditions = ('교차로', '로', '대로', 'TG', 'IC', 'JC')
        return any(name.endswith(cond) for cond in conditions)
    
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
    
    # Retry 설정
    retries = Retry(total=5, backoff_factor=4, status_forcelist=[500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retries)
    
    # 세션 생성 및 어댑터 장착
    session = requests.Session()
    session.mount('https://', adapter)
    session.mount('http://', adapter)

    response = None  # Initialize response to handle errors

    try:
        # GET 요청 보내기
        response = session.get(url, params=params, headers=headers, timeout=10)
        
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
        
        # guide 배열에서 조건을 만족하는 객체의 x, y, duration 추출
        try:
            routes = data.get('routes', [{}])
            sections = routes[0].get('sections', [{}])
            guides = sections[0].get('guides', [])
            duration = routes[0].get('summary', {}).get('duration', 0)
            
            filtered_info = []
            cumulative_duration = 0
            
            for guide in guides:
                if name_condition(guide.get('name', '')):
                    # 누적된 duration을 포함하여 info를 배열로 만들어 [x, y, duration] 형태로 저장
                    cumulative_duration += guide.get('duration', 0)
                    info = [
                        round(guide.get('x', 0), 4),
                        round(guide.get('y', 0), 4),
                        cumulative_duration
                    ]
                    filtered_info.append(info)

            return filtered_info, duration
        
        except (KeyError, IndexError) as e:
            print(f"데이터 추출 오류: {e}")
            return None, None
    
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP 오류 발생: {http_err}")
        print("응답 상태 코드:", response.status_code)
        print("응답 본문:", response.text)
        if response is not None:
            # API limit 초과 시 프로그램 종료
            if response.status_code == 400 and "API limit has been exceeded" in response.text:
                print("API limit has been exceeded! program terminated.")
                print(f"API Key: {os.getenv('KAKAO_REST_API_KEY')}")
                exit()

        else:
            print("응답 객체가 정의되지 않았습니다.")
        return None, None
    
    except requests.exceptions.RequestException as req_err:
        print(f"요청 예외 발생: {req_err}")
        print("retrying after 60 seconds...")
        time.sleep(60)
        return get_data(dep_lon, dep_lat, dest_lon, dest_lat)  # 재시도
    
    except Exception as err:
        print(f"기타 오류 발생: {err}")
        if response is not None:
            print("응답 본문:", response.text)
        return None, None


# 두 좌표 간의 직선거리를 계산하는 함수 (Haversine formula 사용)
def calculate_distance(lon1, lat1, lon2, lat2):
    R = 6371  # 지구의 반경 (단위: km)

    # 위도와 경도를 라디안으로 변환
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine 공식을 사용한 거리 계산
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c

    return distance



def generate_random_coordinates():
    # global excluded, model
    
    # 한계 범위
    y_min, y_max = 34.3, 38.4
    x_min, x_max = 126.1, 129.55
    
    # # 각 지역에 대한 평균값 및 표준편차 설정
    # east = {'y_min': y_min, 'y_max': y_max, 'x_mean': 128.8, 'x_std_dev': 0.5, 'x_max': x_max}
    # west = {'y_min': y_min, 'y_max': y_max, 'x_mean': 126.8, 'x_std_dev': 0.5, 'x_min': x_min}
    # south = {'y_mean': 35.2, 'y_std_dev': 0.5, 'x_min': x_min, 'x_max': x_max}
    
    # # 랜덤으로 동해, 서해, 남해 선택
    # regions = ['east', 'west', 'south']
    # selected_region = random.choice(regions)
    
    # if selected_region == 'east':
    #     y = round(random.uniform(east['y_min'], east['y_max']), 4)  # y 값을 랜덤으로 추출
    #     x = np.random.normal(east['x_mean'], east['x_std_dev'])
    #     x = min(x, east['x_max'])  # 최대 경도 넘지 않도록 제한
    # elif selected_region == 'west':
    #     y = round(random.uniform(west['y_min'], west['y_max']), 4)  # y 값을 랜덤으로 추출
    #     x = np.random.normal(west['x_mean'], west['x_std_dev'])
    #     x = max(x, west['x_min'])  # 최소 경도 넘지 않도록 제한
    # else:  # south
    #     y = np.random.normal(south['y_mean'], south['y_std_dev'])
    #     y = max(y, y_min)  # 최소 위도 넘지 않도록 제한
    #     x = round(random.uniform(south['x_min'], south['x_max']), 4)  # x 값을 랜덤으로 추출
    
    # # x와 y를 소수점 4자리로 반올림
    # y = round(y, 4)
    # x = round(x, 4)

    y = round(random.uniform(y_min, y_max), 4)
    x = round(random.uniform(x_min, x_max), 4)

    prediction = predict(model, x, y)

    if prediction == 1:
        return generate_random_coordinates()

    # if ((x, y) in excluded):
    #     print("excluded data: excluded!")
    #     return generate_random_coordinates()

    return (x, y)

# def get_excluded():
#     global cursor
#     query = 'select * from excluded'
#     try:
#         # 쿼리 실행
#         cursor.execute(query)

#         # 결과 가져오기
#         results = cursor.fetchall()

#         # 결과 반환
#         return results

#     except Error as e:
#         print(f"데이터 조회 오류: {e}")
#         return None

# 출발지와 도착지 좌표를 생성하고, 도착지의 좌표를 업데이트하는 반복문
def generate_and_compare_coordinates():
    # 출발지 좌표 생성
    dep_lon, dep_lat = generate_random_coordinates()
    
    # 초기 도착지 좌표 및 거리 생성
    dest_lon, dest_lat = generate_random_coordinates()
    max_distance = calculate_distance(dep_lon, dep_lat, dest_lon, dest_lat)
    
    # 3번 반복하여 도착지 좌표를 업데이트
    for _ in range(3):
        new_dest_lon, new_dest_lat = generate_random_coordinates()
        new_distance = calculate_distance(dep_lon, dep_lat, new_dest_lon, new_dest_lat)
        
        if new_distance > max_distance:
            dest_lon, dest_lat = new_dest_lon, new_dest_lat
            max_distance = new_distance
    
    return dep_lon, dep_lat, dest_lon, dest_lat



# 메인 코드
print('=' * 50)
print(f"API key: {os.getenv('KAKAO_REST_API_KEY')}")

initialize_database_connection()

# excluded = get_excluded()

model = load_trained_model()

for i in range(ITERATION_NUM):
    print('=' * 50)
    print(f"iteration {i+1}/{ITERATION_NUM}")
    
    dep_lon, dep_lat, dest_lon, dest_lat = generate_and_compare_coordinates()

    route, duration = get_data(dep_lon, dep_lat, dest_lon, dest_lat)

    if duration:
        insert_map_data(dep_lon, dep_lat, dest_lon, dest_lat, duration, route)
        # insert_included_data((dep_lon, dep_lat))
        # insert_included_data((dest_lon, dest_lat))
        print(f"included data: route {len(route)}")

        # if (i+1) % 1000 == 0:
        #     if (i+1) == ITERATION_NUM:
        #         break
        #     model = update_model()

close_database_connection()
