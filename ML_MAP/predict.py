import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.losses import MeanSquaredError
from tensorflow.keras.optimizers import Adam


# 1. 모델 불러오기
def load_existing_model(filename="model.h5"):
    model = load_model(filename, compile=False)  # compile=False로 로드
    model.compile(optimizer=Adam(learning_rate=0.001),
                  loss=MeanSquaredError(),
                  metrics=['mean_squared_error'])
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
    
    print(f"input: {random_input}")
    print(f"output: {prediction[0][0]}")


def predict_with_input(model, input_values, y_min, y_max):
    # 입력 데이터 확인 (4개의 값이 들어와야 함)
    if len(input_values) != 4:
        raise ValueError("Input must be a list or array of 4 elements.")

    # 입력 데이터를 배열로 변환
    input_values = np.array(input_values).reshape(1, -1)

    # 입력 데이터 정규화 (훈련 데이터의 min, max 값 사용)
    min_values = np.array([126.1, 34.3, 126.1, 34.3])
    max_values = np.array([129.55, 38.4, 129.55, 38.4])
    normalized_input = (input_values - min_values) / (max_values - min_values)

    # 예측 수행
    normalized_prediction = model.predict(normalized_input)

    # 예측 결과를 원래 스케일로 변환
    prediction = normalized_prediction * (y_max - y_min) + y_min

    print(f"input: {input_values}")
    print(f"output: {prediction[0][0]}")
    print(f"{(prediction[0][0]):.0f}sec = {int(prediction[0][0] / 60 // 60)} 시간 {(prediction[0][0] / 60 % 60):.0f} 분")

    

# 3. 메인 실행 함수
def main():
    # 기존 모델 로드
    model = load_existing_model("saved_model\my_model_20240826-012247.keras")
    
    # 수동으로 정의한 y_min과 y_max 값
    y_min = 0     # 주어진 duration의 최소값
    y_max = 100000 # 주어진 duration의 최대값
    
    # 랜덤 값을 입력하여 예측 수행
    # for i in range (3):
    #     print('-' * 50)
    #     print(f"Random Value {i+1}")
    #     predict_random_values(model, y_min, y_max)

    while True:
        print("Enter 4 values for prediction:")
        input_values = input().split()
        input_values = [float(i) for i in input_values]
        predict_with_input(model, input_values, y_min, y_max)
        print('-' * 50)

        # nput_values = [127.7884, 35.7884, 127.5998, 37.5077]


if __name__ == "__main__":
    main()
