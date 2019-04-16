#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#
from flask import Flask, render_template, send_file, jsonify, request
from gevent import pywsgi
import werkzeug.serving
import time
import requests
import geocoder
import random
import json

__author__     = "Leon Schnieber"
__copyright__  = "Copyright 2019"
__maintainer__ = "Leon Schnieber"
__email__      = "olaginos-buero@outlook.de"
__status__     = "Developement"

app = Flask("OSM-Pointcloud", template_folder="template")

database = {}
try:
    with open("database.json", "r") as f:
        database = json.load(f)
except FileNotFoundError:
    pass

def rand():
    return ''.join(random.choice("0123456789abcdef") for _ in range(10))

def saveAll():
    with open("database.json", "w") as f:
        json.dump(database, f)
    return

@app.route("/")
def root():
    return render_template("index.html")

@app.route("/api/search/<query>")
def searchPlace(query):
    g = geocoder.osm(query).json
    bounds = [g["bbox"]["northeast"], g["bbox"]["southwest"]]
    data = {"lat": g["lat"], "long": g["lng"], "name": g["address"], "bounds": bounds}
    return jsonify(data)

@app.route("/api/reverseData/<lat>/<long>")
def reverseSearchPlace(lat, long):
    g = geocoder.osm([lat, long], method='reverse')
    data = ""
    if g.street != None:
        data += g.street
        if g.housenumber != None:
            data += " " + str(g.housenumber)
        data += ", "
    if g.city != None and g.postal != None:
        data += g.postal + " " + g.city + ", "
    if g.state != None:
        data += g.state + ", "
    if g.country != None:
        data += g.country
    return jsonify(data)

@app.route("/api/group/list")
def listGroups():
    pass

@app.route("/api/group/<GroupName>/points")
def listPointsInGroup(GroupName):
    if GroupName in database:
        data = database[GroupName]
    else:
        data = {}
    return jsonify(data)

@app.route("/api/point/add/<properties>")
def addPoint(properties):
    properties = properties.split("&")
    props = {}
    for prop in properties:
        key = prop.split("=")[0]
        props[key] = prop.split("=")[1]
    g = geocoder.osm([props["lat"], props["long"]], method='reverse')
    place = ""
    if g.street != None:
        place += g.street
        if g.housenumber != None:
            place += " " + str(g.housenumber)
        place += ", "
    if g.city != None and g.postal != None:
        place += g.postal + " " + g.city + ", "
    if g.state != None:
        place += g.state + ", "
    if g.country != None:
        place += g.country

    data = {"id": rand(), "lat": props["lat"], "long": props["long"], "color": props["color"], "name": props["name"], "place": place, "desc": props["desc"]}
    if props["group"] not in database:
        database[props["group"]] = {}
    database[props["group"]][data["id"]] = data
    saveAll()
    return jsonify(data)

# @app.route("/api/point/edit/<pointID>")
# def editPoint(pointID, properties):
#     pass

@app.route("/api/point/delete/<pointID>")
def deletePoint(pointID):
    for group in database:
        grp = database[group]
        for point in grp:
            if pointID == point:
                del database[group][point]
                saveAll()
                return "ok"
    saveAll()
    return "error"

#app.run()

ws = pywsgi.WSGIServer(('', 8080), app)
ws.serve_forever()
