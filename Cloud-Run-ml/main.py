import pandas as pd
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
import h5py
import json
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from tensorflow.keras.layers import Input, Dense
from tensorflow.keras.models import Model
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
import seaborn as sns

app = Flask(_name_)

# Load the human data autoencoder model
human_autoencoder = load_model('model_human.h5')
human_hidden_representation = tf.keras.models.Model(inputs=human_autoencoder.input,
                                                    outputs=human_autoencoder.get_layer('dense_11').output)

# Load the food data autoencoder model
food_autoencoder = load_model('model_food.h5')
food_hidden_representation = tf.keras.models.Model(inputs=food_autoencoder.input,
                                                   outputs=food_autoencoder.get_layer('dense_11').output)

# Load the human clustering model
human_clustering_model = load_model('prediction_model.h5')

# Load the food recommendation pairing
with open('food_recom.json', 'r') as json_file:
    food_recom = json.load(json_file)


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    # Process human data
    human_data = pd.DataFrame(data)
    human_data.drop('no', axis=1, inplace=True)
    human_data = human_data.replace({'?': np.nan}).dropna()
    human_data = human_data.astype(float)

    # Normalize human data
    scaler = MinMaxScaler()
    human_data = pd.DataFrame(scaler.fit_transform(human_data), columns=human_data.columns)

    # Encode human data
    human_encoded = human_hidden_representation.predict(human_data)

    # Perform human clustering
    human_labels = human_clustering_model.predict_classes(human_data)

    # Process food data
    food_data = pd.DataFrame(data['makanan'])

    # Normalize food data
    food_data = food_data.apply(pd.to_numeric, errors='coerce')
    food_data = food_data.dropna()
    food_data = pd.DataFrame(scaler.transform(food_data), columns=food_data.columns)

    # Encode food data
    food_encoded = food_hidden_representation.predict(food_data)

    # Perform food clustering
    food_labels = food_clustering_model.predict(food_data)

    # Get food recommendations based on human cluster
    recommendations = food_recom[human_labels[0]]

    response = {
        'human_cluster': int(human_labels[0]),
        'food_cluster': int(food_labels[0]),
        'recommendations': recommendations
    }

    return jsonify(response)


if _name_ == '_main_':
    app.run(debug=True)
