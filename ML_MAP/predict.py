import numpy as np
from tensorflow.keras.models import load_model

# 1. 모델 불러오기
def load_existing_model(filename="model.h5"):
    model = load_model(filename)
    print(f"모델이 {filename} 파일에서 불러와졌습니다.")
    return model

# 2. 예측 함수
def predict_random_values(model, y_min, y_max):
    # 랜덤 입력 값 생성 (입력 범위에 맞춰서 생성)
    random_input = np.random.uniform(low=[126.1, 34.3, 126.1, 34.3], 
                                     high=[129.55, 38.4, 129.55, 38.4], 
                                     size=(1, 4))
    
    # 입력 데이터 정규화 (훈련 데이터의 min, max 값 사용)
    min_values = np.array([126.1, 34.3, 126.1, 34.3])
    max_values = np.array([129.55, 38.4, 129.55, 38.4])
    normalized_input = (random_input - min_values) / (max_values - min_values)
    
    # 예측 수행
    normalized_prediction = model.predict(normalized_input)
    
    # 예측 결과를 원래 스케일로 변환
    prediction = normalized_prediction * (y_max - y_min) + y_min
    
    print(f"입력 데이터 (랜덤 생성): {random_input}")
    print(f"예측된 duration: {prediction[0][0]}")

# 3. 메인 실행 함수
def main():
    # 기존 모델 로드
    model = load_existing_model("model.h5")
    
    # 수동으로 정의한 y_min과 y_max 값
    y_min = 0     # 주어진 duration의 최소값
    y_max = 100000 # 주어진 duration의 최대값
    
    # 랜덤 값을 입력하여 예측 수행
    predict_random_values(model, y_min, y_max)

if __name__ == "__main__":
    main()
