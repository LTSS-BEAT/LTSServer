import random

import requests
import os
from dotenv import load_dotenv
load_dotenv()

import mysql.connector
from mysql.connector import Error
import os

# 반복
ITERATION_NUM = 90000

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
            print("MySQL 연결 성공")
            cursor = connection.cursor()
    
    except Error as e:
        print(f"데이터베이스 연결 오류: {e}")

def close_database_connection():
    global connection, cursor
    if connection and connection.is_connected():
        cursor.close()
        connection.close()
        print("MySQL 연결 종료")

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
    global cursor, connection, excluded
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
        excluded.append(data)
    
    except Error as e:
        print(f"데이터 삽입 오류: {e}")



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
            

def get_excluded():
    global cursor
    query = 'select * from excluded'
    try:
        # 쿼리 실행
        cursor.execute(query)
        
        # 결과 가져오기
        results = cursor.fetchall()
        
        # 결과 반환
        return results
    
    except Error as e:
        print(f"데이터 조회 오류: {e}")
        return None

def generate_random_coordinates():
    global excluded

    # 한계 범위
    y_min, y_max = 34.3, 38.4
    x_min, x_max = 126.1, 129.55
    
    # 랜덤한 y와 x 값 생성
    y = round(random.uniform(y_min, y_max), 2)
    x = round(random.uniform(x_min, x_max), 2)

    if ((x, y) in excluded):
        print("excluded!")
        x, y = generate_random_coordinates()
    
    return (x, y)


# 데이터베이스 연결
initialize_database_connection()

excluded = get_excluded()

for i in range(ITERATION_NUM):
    dep_lon, dep_lat = generate_random_coordinates()
    dest_lon, dest_lat = generate_random_coordinates()

    duration = get_duration(dep_lon, dep_lat, dest_lon, dest_lat)

    if duration:
        data_to_insert = (dep_lon, dep_lat, dest_lon, dest_lat, duration)
        insert_map_data(data_to_insert)
        print(f"input data: {data_to_insert}")

# 데이터베이스 종료
close_database_connection()
print (excluded)