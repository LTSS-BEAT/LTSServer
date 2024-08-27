import os
from dotenv import load_dotenv
load_dotenv()
import mysql.connector
from mysql.connector import Error
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score

# 전역 변수
THRESHOLD = 0.5

# 전역 데이터베이스 연결 변수
connection = None
cursor = None

def initialize_database_connection():
    global connection, cursor
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
        print(f"MySQL connection error: {e}")

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

# 랜덤 포레스트 학습 함수
def train_random_forest(X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    y_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_proba >= THRESHOLD).astype(int)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    print(f"Random Forest accuracy: {accuracy:.2f}")
    print(f"Random Forest precision: {precision:.2f}")
    print(f"Random Forest recall: {recall:.2f}")
    
    return model

# 선형 회귀 학습 함수
def train_linear_regression(X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    y_pred_binary = (y_pred >= THRESHOLD).astype(int)
    
    accuracy = accuracy_score(y_test, y_pred_binary)
    precision = precision_score(y_test, y_pred_binary)
    recall = recall_score(y_test, y_pred_binary)
    print(f"Linear Regression accuracy: {accuracy:.2f}")
    print(f"Linear Regression precision: {precision:.2f}")
    print(f"Linear Regression recall: {recall:.2f}")
    
    return model

# 로지스틱 회귀 학습 함수
def train_logistic_regression(X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = LogisticRegression()
    model.fit(X_train, y_train)
    
    y_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_proba >= THRESHOLD).astype(int)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    print(f"Logistic Regression accuracy: {accuracy:.2f}")
    print(f"Logistic Regression precision: {precision:.2f}")
    print(f"Logistic Regression recall: {recall:.2f}")
    
    return model

# 서포트 벡터 머신 학습 함수
def train_svm(X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = SVC(probability=True)
    model.fit(X_train, y_train)
    
    y_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_proba >= THRESHOLD).astype(int)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    print(f"SVM accuracy: {accuracy:.2f}")
    print(f"SVM precision: {precision:.2f}")
    print(f"SVM recall: {recall:.2f}")
    
    return model

# 모든 모델 학습 및 업데이트 함수
def update_model():
    print('-' * 50)

    included_data, excluded_data = fetch_data()
    X, y = preprocess_data(included_data, excluded_data)

    print("Training Random Forest...")
    model_rf = train_random_forest(X, y)
    
    print("\nTraining Linear Regression...")
    model_lr = train_linear_regression(X, y)
    
    print("\nTraining Logistic Regression...")
    model_logreg = train_logistic_regression(X, y)
    
    print("\nTraining SVM...")
    model_svm = train_svm(X, y)

    print("\nAll models updated!")
    
    return {
        'random_forest': model_rf,
        'linear_regression': model_lr,
        'logistic_regression': model_logreg,
        'svm': model_svm
    }


if __name__ == "__main__":
    initialize_database_connection()  # DB 연결 초기화

    models = update_model()  # 모델 업데이트 및 학습

    close_database_connection()  # DB 연결 종료
