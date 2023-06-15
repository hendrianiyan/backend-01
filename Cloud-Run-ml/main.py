import pandas as pd
import numpy as np
import tensorflow as tf
import seaborn as sns
import matplotlib.pyplot as plt
from tensorflow import keras
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.layers import Input, Dense
from tensorflow.keras.models import Model
from tensorflow.keras.losses import MeanSquaredError
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
import h5py
import shutil
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/', methods=['POST'])
def predict():
    # Read input data from request
    data = request.json
    input_data = pd.DataFrame(data, index=[0])
    
    # Load the pre-trained model and necessary data
    autoencoder = tf.keras.models.load_model('model_human.h5')
    with h5py.File('X_tensor.h5', 'r') as hf:
        X_tensor = hf['human_tensor'][:]
    hidden_representation = Model(inputs=autoencoder.input, outputs=autoencoder.layers[2].output)
    
    # Preprocess input data
    ordinal_columns = ['jenis_aktivitas', 'kolesterol', 'asam_lambung', 'diabetes_tipe_1', 'diabetes_tipe_2',
                       'darah_tinggi', 'darah_rendah', 'usus_buntu']
    onehot_columns = ['jenis_kelamin']
    input_data.rename(columns={
        " No ": "no",
        " Jenis Kelamin ": "jenis_kelamin",
        " Usia ": "usia",
        " Berat (kg) ": "berat(kg)",
        " Tinggi (cm) ": "tinggi(cm)",
        " Jenis Aktivitas ": "jenis_aktivitas",
        " Kolesterol ": "kolesterol",
        " Asam Lambung ": "asam_lambung",
        " Diabetes Tipe 1 ": "diabetes_tipe_1",
        " Diabetes Tipe 2 ": "diabetes_tipe_2",
        " Darah Tinggi ": "darah_tinggi",
        " Darah Rendah ": "darah_rendah",
        " Usus Buntu ": "usus_buntu"
    }, inplace=True)
    input_data = pd.get_dummies(input_data, columns=onehot_columns)
    
    for col in ordinal_columns:
        input_data[col] = LabelEncoder().fit_transform(input_data[col])
    
    input_data = pd.DataFrame(scaler.transform(input_data), columns=input_data.columns)
    input_tensor = tf.convert_to_tensor(input_data.values, dtype=tf.float32)
    
    # Generate recommendations
    encoded_data = hidden_representation.predict(input_tensor)
    cluster_labels = kmeans.predict(encoded_data)
    recommended_foods = food_recom[cluster_labels[0]]
    
    # Prepare response
    response = {'recommended_foods': recommended_foods}
    return jsonify(response)

if __name__ == '__main__':
    app.run()


#Make sure to have the following files in the same directory as main.py:

#model_human.h5 - Pre-trained autoencoder model for human data
#X_tensor.h5 - Tensor data for clustering human data
#food_recom.json - JSON file containing the food recommendations for each cluster
#You can deploy this code on Google Cloud Run using the following command:


#gcloud run deploy --image gcr.io/[PROJECT-ID]/[IMAGE-NAME] --platform managed

#Replace [PROJECT-ID] with your Google Cloud project ID and [IMAGE-NAME] with the desired name for your container image.

#Note: The code provided assumes that you have the necessary data files (model_human.h5, X_tensor.h5, food_recom.json) in the same directory as main.py. Adjust the paths accordingly if the files are located in different directories.

#Also, ensure that you have installed the required dependencies (pandas, numpy, tensorflow, seaborn, matplotlib, flask) in your environment.

#Let me know if you need further assistance!