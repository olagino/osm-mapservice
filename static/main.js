var leafmap = L.map('big-leaflet').setView([51.3, 10.4], 6);
var tiles = "";
var markerList = [];
var searchMarker = L.marker([90, 0.0],{icon: leafmapMarker});
var searchMarkerLatlon = new L.LatLng(90,0);
var cloudGroup = "pointcloud";
var markerhop = true;
searchMarker.addTo(leafmap);

function querySearch() {
  var query = $("#searchboxbox").val();
  $("#searchboxbox").val("");
  $.get("/api/search/" + query, function(data) {

    leafmap.fitBounds(data["bounds"]);
    moveMarker(data);
  })
}

function moveMarkerMapclick(e) {
  if(markerhop) {
    $.get("/api/reverseData/" + e.latlng.lat + "/" + e.latlng.lng, function(feedback) {
      data = {"lat": e.latlng.lat, "long": e.latlng.lng, "name": feedback}
      moveMarker(data);
    });
  }
}

function moveMarker(data) {
  if(markerhop) {
    searchMarkerLatlon = new L.LatLng(data["lat"], data["long"]);
    searchMarker.setLatLng(searchMarkerLatlon)
    restbox = genRestbox();
    searchMarker.bindPopup("<span class='fatbox'></span><b>" + data["name"].split(",")[0] + "</b><br />" + data["name"] + "<hr />" + restbox)
    searchMarker.openPopup();
  }
}

function markerFreeze() {
  markerhop = false
}

function markerUnfreeze() {
  markerhop = true
}

function genRestbox() {
  var text = "";
  text += '<div class="input-group mb-3">';
  text += '  <input  id="point_title" type="text" class="form-control form-control-sm" placeholder="Name des Punktes"><div class="input-group-append">';
  text += '  <button class="btn btn-sm btn-outline-primary" type="button" onclick="saveMarkerPoint()">abspeichern</button>';
  text += '</div>';
  text += '<br />';
  text += '<div class="input-group mb-3">';
  text += '  <input id="point_description" type="text" class="form-control form-control-sm" placeholder="Beschreibung"><div class="input-group-append">';
  text += '  <select name="point_color" id="point_color" class="custom-select-sm custom-select mb-3">';
  text += '    <option value="#fc1423" selected>Rot</option>';
  text += '    <option value="#A647C1">Lila</option>';
  text += '    <option value="#042ccc">Blau</option>';
  text += '    <option value="#14fcf4">Türkis</option>';
  text += '    <option value="#2EB838">Grün</option>';
  text += '    <option value="#ecfc14">Gelb</option>';
  text += '  </select>';
  text += '</div>';
  return text
}

function refreshCloud() {
  $.get("/api/group/" + cloudGroup + "/points", function(data) {
    var tableString = "";
    var count = 0;
    var existingPoints = [];
    for (var point in data) {
      if (data.hasOwnProperty(point)) {
        count += 1;
        var pt = data[point];
        if(markerList.hasOwnProperty([pt["id"]]) == false) {
          var set = {"lat": pt["lat"], "long": pt["long"], "color": pt["color"], "place": pt["place"], "name": pt["name"], "desc": pt["desc"]};
          addMarker(pt["id"], set);
        }
        tableString += "<tr onclick=\"showMarker('" + pt["id"] + "')\" id=\"table_marker_" + pt["id"] + "\">";
        tableString += "<td><div class=\"smallBlock\" style=\"background-color: #" + pt["color"] + "\"></div></td>";
        tableString += "<td><a class=\"table_el\">" + pt["name"] + "</a></td>";
        tableString += "<td>" + pt["place"] + "</td>";
        tableString += "</tr>";
        existingPoints.push(pt["id"]);
      }
    }

    for (var marker in markerList) {
      if(markerList.hasOwnProperty(marker)) {
        var mk = markerList[marker]
        if(existingPoints.indexOf(marker) < 0) {
          removeMarker(marker)
        }
      }
    }

    $("#point_cloud_count").html(count);
    $("#point_cloud tbody").html(tableString);
  });
}

function saveMarkerPoint() {
  var lat = searchMarkerLatlon.lat
  var long = searchMarkerLatlon.lng
  var color = $('select[name=point_color]').val().replace("#", "")
  var name = $("#point_title").val();
  var desc = $("#point_description").val();
  var meta = "lat=" + lat + "&long=" + long + "&color=" + color + "&name=" + name + "&desc=" + desc + "&group=" + cloudGroup;
  $.get("/api/point/add/"  + meta.replace("#", ""), function(data) {
    refreshCloud();
    searchMarker.closePopup();
    addMarker(data["id"], data);
  });
}

function addMarker(id, data) {
  var marker = L.marker([data["lat"], data["long"]],{icon: leafmapMarker});
  marker.addTo(leafmap);
  name = data["name"] || "kein Titel"
  desc = data["desc"] || "<i>keine Beschreibung hinterlegt</i>"
  place = "<p><b><i>" + data["place"].split(",")[0] + "</i></b><br />"
  place += data["place"].replace(",", "<br />") + "</p>" || ""
  var popupHTML = "<b>" + name + "</b><br />";
  popupHTML += "<span>" + desc + "</span><hr />";
  popupHTML += place;
  popupHTML += "<hr />";
  popupHTML += "<a class=\"btn btn-danger btn-sm\" onclick=\"removeMarkerFully('" + id + "')\">Punkt löschen</a>";
  marker.bindPopup(popupHTML);
  $(marker.valueOf()._icon).find("div.foo").css("background-color", data["color"]);
  markerList[id] = marker;
}

function showMarker(id) {
  markerList[id].openPopup();
  leafmap.fitBounds(L.latLngBounds([markerList[id].getLatLng()]));
}

function removeMarker(id) {
  if(markerList[id]) {
    leafmap.removeLayer(markerList[id]);
  }
}

function removeMarkerFully(id) {
  $.get("/api/point/delete/" + id, function(data) {
    if(data == "ok") {
      removeMarker(id);
      $("#table_marker_" + id).remove();
    } else {

    }
  });
}

function changeMap(url) {
  // L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {
  tiles = L.tileLayer(url, {
    attribution: '',
    maxZoom: 20
  }).addTo(leafmap);
}

function changeMapEvent() {
  var url = $("#changeMapEventBox option:selected").val();
  changeMap(url);
  console.log("CHANGE" + url)
}

window.onload = function() {
  $("#searchboxbox").keypress(function (e) {
    if (e.which == 13) {
      querySearch();
      return false;
    }
  });

  $("#searchboxenter").click(function() {
    querySearch();
  });

  $("#cloudGroup").keypress(function (e) {
    if (e.which == 13) {
      cloudGroup = $("#cloudGroup").val();
      refreshCloud();
      return false;
    }
  });

  $("#cgid-refresh").click(function() {
    cloudGroup = $("#cloudGroup").val();
    refreshCloud();
  });

  $("#cgid-share").click(function() {
    window.open(window.location.href.split("?")[0] + "/?" + cloudGroup, '_blank')
  });

  var turl = window.location.href.split("?");
  if(turl.length == 2 && turl[0].length >= 0) {
    cloudGroup = turl[1];
  } else {
    cloudGroup = Math.random().toString(36).substring(3);
  }
  $("#cloudGroup").val(cloudGroup);

  changeMap("http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png");
  // tiles = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
  //   attribution: '',
  //   maxZoom: 20
  // }).addTo(leafmap);

  leafmap.on("click", moveMarkerMapclick);
  refreshCloud();
  var foo = setInterval(function(){refreshCloud();}, 5*1000);
}
