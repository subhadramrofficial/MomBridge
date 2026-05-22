# pip install pymongo dnspython
import os
from pymongo import MongoClient
from bson import ObjectId


class MongoDB(object):

    def __init__(self, db_name=None, username=None, password=None, host=None, port=None):
        
        # Environment or default values
        if db_name is None:
            db_name = os.getenv("MONGO_DATABASE") or "mombridge"

        if username is None:
            username = os.getenv("MONGO_USERNAME")   # optional
        if password is None:
            password = os.getenv("MONGO_PASSWORD")   # optional

        if host is None:
            host = os.getenv("MONGO_HOST") or "localhost"
        if port is None:
            port = os.getenv("MONGO_PORT") or "27017"

        # MongoDB URI
        if username and password:
            uri = f"mongodb://{username}:{password}@{host}:{port}/{db_name}"
        else:
            uri = f"mongodb://{host}:{port}/"

        # Save client and DB object
        self.client = MongoClient(uri)
        self.db = self.client[db_name]


    def get_collection(self, collection_name):
        """ Return a MongoDB collection object """
        return self.db[collection_name]


    # ------------------------------
    # CRUD OPERATIONS
    # ------------------------------

    def insert_one(self, collection, data):
        col = self.get_collection(collection)
        result = col.insert_one(data)
        return str(result.inserted_id)

    def find_one(self, collection, query):
        col = self.get_collection(collection)
        data = col.find_one(query)
        if data:
            data["_id"] = str(data["_id"])
        return data

    def find_all(self, collection, query={}):
        col = self.get_collection(collection)
        records = []
        for doc in col.find(query):
            doc["_id"] = str(doc["_id"])
            records.append(doc)
        return records

    def update_one(self, collection, query, new_values):
        col = self.get_collection(collection)
        result = col.update_one(query, {"$set": new_values})
        return result.modified_count

    def delete_one(self, collection, query):
        col = self.get_collection(collection)
        result = col.delete_one(query)
        return result.deleted_count


# Helper: convert id to ObjectId
def oid(id_str):
    return ObjectId(id_str)
