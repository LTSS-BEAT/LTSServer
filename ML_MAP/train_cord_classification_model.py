import os
from dotenv import load_dotenv
load_dotenv()
import mysql.connector
from mysql.connector import Error
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, precision_recall_curve, accuracy_score, f1_score, roc_curve, auc
from sklearn.ensemble import RandomForestClassifier
import numpy as np
import matplotlib.pyplot as plt
import joblib
from datetime import datetime

# 전역 변수
MODEL_PATH = "ML_MAP/classification_model/cord_classification_model.pkl"  # 모델을 불러올 파일 경로

def get_model_save_path():
    now = datetime.now()
    timestamp = now.strftime("%Y%m%d_%H%M%S")
    return f"ML_MAP/classification_model/cord_classification_model_{timestamp}.pkl"

def fetch_data(cursor):
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
        y.append(0)  # included를 0으로 라벨링

    for data in excluded_data:
        X.append([float(data[0]), float(data[1])])
        y.append(1)  # excluded를 1로 라벨링

    return np.array(X), np.array(y)

def train_model(X, y):
    global THRESHOLD_F1

    # 데이터를 학습용과 테스트용으로 분리
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 랜덤 포레스트 모델 초기화
    model = RandomForestClassifier(n_estimators=25, random_state=42)

    # 모델 학습
    model.fit(X_train, y_train)

    # 테스트 데이터로 예측 수행
    y_proba = model.predict_proba(X_test)[:, 1]

    precisions, recalls, thresholds = precision_recall_curve(y_test, y_proba)
    
    # F1-score 최대화
    f1_scores = 2 * (precisions * recalls) / (precisions + recalls)
    optimal_f1_idx = np.argmax(f1_scores)
    if optimal_f1_idx < len(thresholds):
        THRESHOLD_F1 = thresholds[optimal_f1_idx]
    else:
        THRESHOLD_F1 = thresholds[-1]  # 최대 임계값을 선택

    print(f"Optimal Threshold for Maximum F1-score: {THRESHOLD_F1:.3f}")

    # F1-score을 최적의 스레숄드로 예측
    y_pred_f1 = (y_proba >= THRESHOLD_F1).astype(int)

    # 모델 성능 출력
    accuracy_f1 = accuracy_score(y_test, y_pred_f1)
    precision_f1 = precision_score(y_test, y_pred_f1)
    recall_f1 = recall_score(y_test, y_pred_f1)

    print(f"Model accuracy (F1 Threshold): {accuracy_f1:.3f}")
    print(f"Model precision (F1 Threshold): {precision_f1:.3f}")
    print(f"Model recall (F1 Threshold): {recall_f1:.3f}")

    # Precision-Recall 곡선과 ROC 곡선 시각화
    plt.figure(figsize=(15, 6))

    # Precision-Recall 곡선
    plt.subplot(1, 2, 1)
    plt.plot(thresholds, precisions[:-1], label="Precision", color="blue")
    plt.plot(thresholds, recalls[:-1], label="Recall", color="green")
    plt.axvline(x=THRESHOLD_F1, color="purple", linestyle="--", label=f"Optimal F1 Threshold ({THRESHOLD_F1:.3f})")
    plt.xlabel("Threshold")
    plt.ylabel("Score")
    plt.title("Precision-Recall vs Threshold")
    plt.legend(loc="best")
    plt.grid()

    # ROC 곡선
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    roc_auc = auc(fpr, tpr)

    plt.subplot(1, 2, 2)
    plt.plot(fpr, tpr, color='blue', label=f'ROC curve (area = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='gray', linestyle='--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic (ROC)')
    plt.legend(loc='lower right')
    plt.grid()

    plt.tight_layout()
    plt.show()

    # 모델 저장
    model_save_path = get_model_save_path()
    joblib.dump(model, model_save_path)
    print(f"Model saved to {model_save_path}")

    return model

def load_trained_model():
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"Model loaded from {MODEL_PATH}")
        return model
    else:
        print(f"No saved model found at {MODEL_PATH}")
        return None

def predict(model, x, y):
    if model is None:
        raise ValueError("Model is not loaded.")
    
    # 새 데이터 포인트의 확률 예측
    y_proba_new = model.predict_proba([[x, y]])[:, 1]
    
    # F1-score에 따라 최적의 스레숄드로 이진 예측
    prediction = (y_proba_new >= THRESHOLD_F1).astype(int)
    
    return prediction[0]

# 데이터베이스 연결 설정
connection = None
cursor = None

try:
    connection = mysql.connector.connect(
        host=os.getenv('RDS_HOST'),
        database=os.getenv('RDS_DB_ML'),
        user=os.getenv('RDS_USER'),
        password=os.getenv('RDS_PASSWORD')
    )
    
    if connection.is_connected():
        cursor = connection.cursor()
        print("MySQL connected")

        # 데이터 가져오기 및 전처리
        included_data, excluded_data = fetch_data(cursor)
        X, y = preprocess_data(included_data, excluded_data)

        # 모델 학습 및 저장
        model = train_model(X, y)

finally:
    if cursor:
        cursor.close()
    if connection and connection.is_connected():
        connection.close()
        print("MySQL connection closed")

# # 모델 로드 및 예측
# model = load_trained_model()

# if model:
#     # 새로운 좌표에 대한 예측 예시
#     x_new, y_new = 1.0, 2.0  # 예시 좌표
#     prediction = predict(model, x_new, y_new)
#     print(f"Prediction for coordinates ({x_new}, {y_new}): {prediction}")
