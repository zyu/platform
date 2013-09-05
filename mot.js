var map;
var vector_layer;
var spatialSearch = false;
var drawFeatureControl;
var vectorLayer_filter;
var pointMarker;
var lineMarker;
var polygonMarker;
var firstLoad = true;

//后台配置文件读取出来的wfs protocol相关的值
var wfs_protocol_url;
var wfs_protocol_feature_type;
var wfs_protocol_feature_ns;

function onFeatureInsertedOnVectorLayer(feature) {
        if (!firstLoad) {
                if (pointMarker) {
                        pointMarker.deactivate();
                }
                if(lineMarker) {
                        lineMarker.deactivate();
                }
                if (polygonMarker) {
                        polygonMarker.deactivate();
                }
        }
        
        var lonLat = new OpenLayers.LonLat(feature.geometry.bounds.right,feature.geometry.bounds.top);  
        
        var popup = new OpenLayers.Popup("popup_" + feature.id,
                        lonLat,
            new OpenLayers.Size(50,20),
            "地块名称",
            false);
        popup.autoSize = true;
        popup.setBorder("1px black solid");
        popup.displayClass = "popup";
        map.addPopup(popup);
        
}

function searchFeatureByAttribute(landIds) {
        for (var i=0;i<map.popups.length;i++) {
                map.removePopup(map.popups[i]);
                map.popups[i].hide();
        }
        
        //构建查询出来的地块id集合，通过WFS查询满足条件的Feature
        searchFilters = composeAttributeSearchFilters(landIds);
        vector_layer.filter = new OpenLayers.Filter.Logical({
                type:OpenLayers.Filter.Logical.OR,
                filters:searchFilters
        });
                        
        vector_layer.refresh();
}

function composeAttributeSearchFilters(landIds) {
        var filters = new Array(landIds.length);
        for (var i=0;i<landIds.length;i++) {
                filters[i] = composeAttributeSearchFilter(landIds[i]);
        }
        return filters;
}

function composeAttributeSearchFilter(landId) {
        var filter = new OpenLayers.Filter.Comparison({
        type: OpenLayers.Filter.Comparison.EQUAL_TO,
        property: "id",
        value: landId
    });
        return filter;
}

function onClickSpatialSearchButton() {
        spatialSearch = !spatialSearch;
        if(spatialSearch) {
                vectorLayer_filter = vector_layer.filter;
                searchFeatureBySpatial();
        } else {
                deactivateSpatialSearch();
        }
        
}

function searchFeatureBySpatial() {
        var temp_layer = new OpenLayers.Layer.Vector('Temporary Vector Layer',{
                opacity:0.5
                });
        temp_layer.display(false);
        map.addLayer(temp_layer);
        drawFeatureControl = new OpenLayers.Control.DrawFeature(temp_layer, OpenLayers.Handler.Polygon);
        map.addControl(drawFeatureControl);
        drawFeatureControl.activate();
        temp_layer.events.on({
            beforefeatureadded: function(event) {
                vector_layer.filter = new OpenLayers.Filter.Spatial({
                    type: OpenLayers.Filter.Spatial.INTERSECTS,
                    value: event.feature.geometry,
                    projection: new OpenLayers.Projection('EPSG:900913')
                });
                vector_layer.refresh();
                return false;
            }
        });
}

function deactivateSpatialSearch() {
        drawFeatureControl.deactivate();
        drawFeatureControl.destroy();
        
        vector_layer.filter = vectorLayer_filter;
        vector_layer.refresh();
}

/**
 * 激活点标注控件
 */
function activatePointMarker() {
        if (pointMarker == null) {
                
                pointMarker = new OpenLayers.Control.DrawFeature(vector_layer, OpenLayers.Handler.Point);
                
                map.addControl(pointMarker);
        }
        pointMarker.activate();
        firstLoad = false;
}

/**
 * 激活线标注控件
 */
function activateLineMarker() {
        if (lineMarker == null) {
                lineMarker = new OpenLayers.Control.DrawFeature(vector_layer, OpenLayers.Handler.Path);
                map.addControl(lineMarker);
        }
        
        lineMarker.activate();
        firstLoad = false;
}

/**
 * 激活多边形标注控件
 */
function activatePolygonMarker() {
        if (polygonMarker == null) {
                polygonMarker = new OpenLayers.Control.DrawFeature(vector_layer, OpenLayers.Handler.Polygon);
                map.addControl(polygonMarker);
        }
        polygonMarker.activate();
        firstLoad = false;
}