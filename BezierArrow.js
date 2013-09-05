function ComputeBezier(pts, nMaxNum, dMint, dMaxt, Cni, dt)
{
  var ptsBezier = []; 
	var _t, _1_t;//自变量
	var n = pts.length;
	if( n<3 )
	{
		for( var i=0; i<pts.length; i++ )
      ptsBezier.push(pts[i]);
		return ptsBezier;
	}
	
	ptsBezier.push(pts[0]);
	for( var t=dMint; t<dMaxt; t+=dt )
	{
		var pt = new NGeometry.Point();
		_t = 1.0;
		_1_t = Math.pow(1.0-t, n-1);
		pt.x = pts[0].x * _1_t;
		pt.y = pts[0].y * _1_t;
		
		//计算基函数
		for( var i=1; i<n; i++ )
		{
			_t *= t;
			_1_t /= (1.0-t);
			Cni = Cni * (n-i)/i;
			pt.x += Cni * pts[i].x * _t * _1_t;
			pt.y += Cni * pts[i].y * _t * _1_t;
		}
		
		ptsBezier.push(pt);

		if( nMaxNum==ptsBezier.length )
			break;
	}

	return ptsBezier;
}

function triangleArea(p0, p1, p2)
{
	return (p2.x-p0.x)*(p1.y-p0.y) - (p1.x-p0.x)*(p2.y-p0.y);
}

function distance(p1, p2)
{
	return Math.sqrt((p1.x - p2.x)*(p1.x - p2.x) + (p1.y - p2.y)*(p1.y - p2.y));
}

function distance2(p, p1, p2)
{
	var	area = triangleArea(p1, p, p2);
	if(area != 0)
	{
		var	cosa = p2.x - p1.x;
		var	sina = p2.y - p1.y;
		var	len = Math.sqrt(cosa*cosa+sina*sina);
		area /= len;
	}
	return area;
}

function PointsDistance(pts)
{
	var dDist = 0.0;
	for( var i=1; i<pts.length; i++ )
		dDist += distance(pts[i], pts[i-1]);

	return dDist;
}

function parallel(h, p1, p2)
{
  var p3 = new NGeometry.Point();
  var p4 = new NGeometry.Point();
  
  var dx = p2.x - p1.x;
	var dy = p2.y - p1.y;

	var len = Math.sqrt(dx*dx + dy*dy);
	 p3.x = p1.x;
	 p3.y = p1.y;
	 p4.x = p2.x;
	 p4.y = p2.y;
	   
	if(len > 0)
	{
		dy *= h / len;
		p3.x -= dy;
		p4.x -= dy;

		dx *= h / len;
		p3.y += dx;
		p4.y += dx;
	}
  
  var pts = [];
  pts.push(p3);
  pts.push(p4);
  return pts;
}

function CreateArrowHead(ptArrowStart, ptArrowEnd, dAnagle1, dAnagle2, bPolyArrow)
{
	var ptsArrow = [];
	var dDis = distance(ptArrowStart, ptArrowEnd)*(Math.sin(dAnagle1)*Math.cos(dAnagle1+dAnagle2)/Math.sin(dAnagle2));
	
	var pt = new NGeometry.Point();
	pt.x = ptArrowEnd.x + (ptArrowStart.x - ptArrowEnd.x)*(1.0 + Math.sin(dAnagle1)*Math.sin(dAnagle1+dAnagle2)/Math.sin(dAnagle2));
	pt.y = ptArrowEnd.y + (ptArrowStart.y - ptArrowEnd.y)*(1.0 + Math.sin(dAnagle1)*Math.sin(dAnagle1+dAnagle2)/Math.sin(dAnagle2));
	var pts = parallel( dDis, pt, ptArrowEnd);
	if( bPolyArrow )
	   ptsArrow.push(ptArrowStart);
	   
	ptsArrow.push(pts[0]);
	ptsArrow.push(ptArrowEnd);
	pts = parallel( -dDis, pt, ptArrowEnd);
	ptsArrow.push(pts[0]);
	
	if( bPolyArrow )
	   ptsArrow.push(ptArrowStart);
	return ptsArrow;
}

function CreateBezierArrowLine(points, dDis, dAnagle1, dAnagle2, bPolyArrow)
{
	if( points.length<2 )
		return null;

  var ptArrowStart = points[points.length - 2];
  var ptArrowEnd = points[points.length - 1];

  var ptsCtrl = [];
  for( var i=0; i<points.length-1; i++ )
    ptsCtrl.push(points[i]);
	
	var dEndTwoDis = distance(ptArrowStart, ptArrowEnd);
	if( dDis<=0 )
	{
		dDis = dEndTwoDis / 10.0;
	}
	
	if( dDis>=dEndTwoDis )
	{
		dDis = dEndTwoDis;
	}
	else
	{
		var pt = new NGeometry.Point();
		pt.x = ptArrowEnd.x + (ptArrowStart.x - ptArrowEnd.x) * dDis / dEndTwoDis;
		pt.y = ptArrowEnd.y + (ptArrowStart.y - ptArrowEnd.y) * dDis / dEndTwoDis;
		ptsCtrl.push(pt);

		ptArrowStart = pt;
	}
	
	var ptsBezier = ComputeBezier(ptsCtrl, 0, 0.01, 1.01, 1, 0.01);
	if( !bPolyArrow )
	   ptsBezier.push(ptArrowEnd);
	var feature  = new NGeometry.Collection();
	feature.addComponent(new NGeometry.LineString(ptsBezier), null);

	var pts = CreateArrowHead(ptArrowStart, ptArrowEnd, dAnagle1, dAnagle2, bPolyArrow);
	if( bPolyArrow )
	   feature.addComponent(new NGeometry.LinearRing(pts), null);
	else
	   feature.addComponent(new NGeometry.LineString(pts), null);
	/*for( i=0; i<pts.length; i++ )
	   ptsBezier.push(pts[i]);
	var feature  = new NGeometry.MultiLineString();
	feature.addComponent(new NGeometry.LineString(ptsBezier), null);  */
	return feature;
}

function CreateArrowCtrl(pts, dStandard, dDistance, pBottomL, pBottomR, dAnagle1, dAnagle2) {

    
  
	if( pts.length<2 )
		return null;

	var points = [];
	if( pts.length==2 )
	{
		var ptTmp1 = new NGeometry.Point();
    var ptTmp2 = new NGeometry.Point();
		ptTmp1.x = pts[0].x + (pts[1].x - pts[0].x)/2.0;
		ptTmp1.y = pts[0].y + (pts[1].y - pts[0].y)/2.0;
		ptTmp2.x = pts[0].x + (pts[1].x - pts[0].x)*3.0/4.0;
		ptTmp2.y = pts[0].y + (pts[1].y - pts[0].y)*3.0/4.0;
		points.push(pts[0]);
		points.push(ptTmp1);
		points.push(ptTmp2);
		points.push(pts[1]);
	}
	else
	{
	  for( var i=0; i<pts.length; i++ )
	     points.push(pts[i]);
	}
	
	var partLeft = [];
	var partArrow = [];
	var partRight = [];
	var partEnd = [];
	var dTolLen = PointsDistance(points);
	var dLen = 0.0;
	
	if( dTolLen<3*dDistance )
		dDistance = dTolLen / 3.0;
	
	{
		var pt = new NGeometry.Point();
		pt.x = (points[0].x + points[1].x)/2.0;
		pt.y = (points[0].y + points[1].y)/2.0;
		partEnd.push(pt);
	}
	
	var dScaleL = 1.0;
	var dScaleR = 1.0;
	if( pBottomL==null || pBottomR==null )
	{
		var ptsTmp = parallel( dDistance, points[0], points[1]);
		partLeft.push(ptsTmp[0]);
		ptsTmp = parallel( -dDistance, points[0], points[1]);
		partRight.push(ptsTmp[0]);
	}
	else
	{
		partLeft.push(pBottomL);
		partRight.push(pBottomR);
		dDistance = Math.abs(distance2(pBottomL, points[0], points[1])) + Math.abs(distance2(pBottomR, points[0], points[1]));
		dScaleL = Math.abs(distance2(pBottomL, points[0], points[1])) / dDistance;
		dScaleR = 1.0 - dScaleL;
	}
	
	for( var i=1; i<points.length-1; i++ )
	{
		dLen += distance(points[i], points[i-1]);
		var dDis = dDistance*(dTolLen - dLen)/dTolLen;
		var ptsTmp = parallel( dDis*dScaleL, points[i-1], points[i]);
		partLeft.push(ptsTmp[1]);
		ptsTmp = parallel( -dDis*dScaleR, points[i-1], points[i]);
		partRight.push(ptsTmp[1]);
	}
	
	// 
	var ptArrowEnd = points[points.length-1].clone();
  var ptArrowStart = points[points.length-2].clone();
	var dArrow = distance(ptArrowStart, ptArrowEnd);
	if( dArrow>dStandard )
	{
		var dDis = dDistance*dStandard/dTolLen;
		var pt = new NGeometry.Point();
		pt.x = ptArrowStart.x + (ptArrowEnd.x - ptArrowStart.x)*(1.0 - dStandard/dArrow);
		pt.y = ptArrowStart.y + (ptArrowEnd.y - ptArrowStart.y)*(1.0 - dStandard/dArrow);
		
		var ptsTmp = parallel( dDis*dScaleL, ptArrowStart, pt);
		partLeft.push(ptsTmp[1]);
		ptsTmp = parallel( -dDis*dScaleR, ptArrowStart, pt);
		partRight.push(ptsTmp[1]);
	}
	
	{
		ptArrowStart = partLeft[partLeft.length-1];
		ptArrowEnd   = points[points.length-1];
		var dDis = distance(ptArrowStart, ptArrowEnd)*(Math.sin(dAnagle1)*Math.cos(dAnagle1+dAnagle2)/Math.sin(dAnagle2));
		
		var pt = new NGeometry.Point();
		pt.x = ptArrowEnd.x + (ptArrowStart.x - ptArrowEnd.x)*(1.0 + Math.sin(dAnagle1)*Math.sin(dAnagle1+dAnagle2)/Math.sin(dAnagle2));
		pt.y = ptArrowEnd.y + (ptArrowStart.y - ptArrowEnd.y)*(1.0 + Math.sin(dAnagle1)*Math.sin(dAnagle1+dAnagle2)/Math.sin(dAnagle2));
		var ptsTmp = parallel( dDis*dScaleL, pt, ptArrowEnd);
		partArrow.push(ptsTmp[0]);
		partArrow.push(points[points.length-1]);
	}
	
	{
		ptArrowStart = partRight[partRight.length-1];
		ptArrowEnd   = points[points.length-1];
		var dDis = distance(ptArrowStart, ptArrowEnd)*(Math.sin(dAnagle1)*Math.cos(dAnagle1+dAnagle2)/Math.sin(dAnagle2));
		
		var pt = new NGeometry.Point();
		pt.x = ptArrowEnd.x + (ptArrowStart.x - ptArrowEnd.x)*(1.0 + Math.sin(dAnagle1)*Math.sin(dAnagle1+dAnagle2)/Math.sin(dAnagle2));
		pt.y = ptArrowEnd.y + (ptArrowStart.y - ptArrowEnd.y)*(1.0 + Math.sin(dAnagle1)*Math.sin(dAnagle1+dAnagle2)/Math.sin(dAnagle2));
		var ptsTmp = parallel( -dDis*dScaleR, pt, ptArrowEnd);
		partArrow.push(ptsTmp[0]);
	}
	
	var partRightReverse = [];
	for( i=partRight.length-1; i>=0; i-- )
	   partRightReverse.push(partRight[i]);
	
	var parts = [];
	parts.push(partLeft);
	parts.push(partArrow);
	parts.push(partRightReverse);
	parts.push(partEnd);

	return parts;
}

function CreateBezierArrow(ctrl, bDovetail)
{
	if( ctrl.length<3 )
		return null;

  var result = [];
	var i = 0;
	var nPartCount = ctrl.length;
	while( i<nPartCount-1 )
	{
		if( i==0 )
		{
			// 左箭头曲线
			{
				var pts = ctrl[i];
				var ptsBezier = ComputeBezier(pts, 0, 0.01, 1.01, 1, 0.01);
				for( var j=0; j<ptsBezier.length; j++ )
				  result.push(ptsBezier[j]);
			}
			
			// 箭头曲线
			if( (i+1)<ctrl.length-1 )
			{
				var pts = ctrl[i+1];
				for( var j=0; j<pts.length; j++ )
				  result.push(pts[j]);
			}
			
			// 右箭头曲线
			if( (i+2)<ctrl.length-1 )
			{
				var pts = ctrl[i+2];
				var ptsBezier = ComputeBezier(pts, 0, 0.01, 1.01, 1, 0.01);
				for( var j=0; j<ptsBezier.length; j++ )
				  result.push(ptsBezier[j]);
			}

			i += 3;
		}
		else
		{
			// 箭头曲线
			{
				var pts = ctrl[i];
				for( var j=0; j<pts.length; j++ )
				  result.push(pts[j]);
			}
			
			// 右箭头曲线
			if( (i+1)<ctrl.length-1 )
			{
				var pts = ctrl[i+1];
				var ptsBezier = ComputeBezier(pts, 0, 0.01, 1.01, 1, 0.01);
				for( var j=0; j<ptsBezier.length; j++ )
				  result.push(ptsBezier[j]);
			}
			
			i += 2;
		}
	}

	// 箭头尾部
	if( i==ctrl.length-1 && i>0 )
	{
		var pts = ctrl[i];
		if( ctrl[i-1].length>0 && ctrl[0].length>0 )
		{
		  var pts = [];
		  pts.push(ctrl[i-1][ctrl[i-1].length-1]);
		  for( var j=0; j<ctrl[i].length; j++ )
		      pts.push(ctrl[i][j]);
		  pts.push(ctrl[0][0]);
			if( bDovetail )
			{
				for( j=0; j<pts.length; j++ )
				  result.push(pts[j]);
			}
			else
			{
				var ptsBezier = ComputeBezier(pts, 0, 0.01, 1.01, 1, 0.01);
				for( j=0; j<ptsBezier.length; j++ )
				  result.push(ptsBezier[j]);
			}
		}
	}
	
	return result;
}

function CreateBezierArrowPolygon(pts, dDistance, dStandard, dAnagle1, dAnagle2, bDovetail)
{
	if( pts.length<2 )
	   return null;
	
 	var parts = CreateArrowCtrl(pts, dStandard, dDistance, null, null, 8.0 * Math.PI / 180.0, 30.0 * Math.PI / 180.0);
 	if( parts.length<=0 )
 		return null ;

	var ptsBezier = CreateBezierArrow(parts, bDovetail);
	var feature  = new NGeometry.Collection();
	feature.addComponent(new NGeometry.LinearRing(ptsBezier), null);
	
	return feature;
}

NDrawBezierArrowLineProcessor = NObject(NDrawPointProcessor, {
    line: null,
    bezierArrow: null,
    bPolyArrow: false,
    handDrawing: false,
    freehandToggle: 'shiftKey',
    construct: function (control, callbacks, options) {
        NDrawPointProcessor.prototype.construct.apply(this, arguments)
    },
    createFeature: function () {
        this.bezierArrow = new NVectorFeature(new NGeometry.Collection());
        this.line = new NVectorFeature(new NGeometry.MultiPoint());
        this.point = new NVectorFeature(new NGeometry.Point());
        this.layer.addFeatures([this.line, this.point], {
            silent: true
        })
    },
    disposeFeature: function () {
        NDrawPointProcessor.prototype.disposeFeature.apply(this);
        this.line = null;
        this.bezierArrow = null;
    },
    disposePoint: function () {
        if (this.point) {
            this.layer.disposeFeatures([this.point])
        }
    },
    resetBezierArrow: function(){
        this.layer.disposeFeatures([this.bezierArrow]);
        this.bezierArrow.geometry = CreateBezierArrowLine(this.line.geometry.clone().components, 0.0, 8.0 * Math.PI / 180.0, 30.0 * Math.PI / 180.0, this.bPolyArrow);
        this.layer.addFeatures([this.bezierArrow]);
    },
    addPoint: function () {
        this.line.geometry.addComponent(this.point.geometry.clone(), this.line.geometry.components.length);
        this.resetBezierArrow();
        this.callback("point", [this.point.geometry, this.getGeometry()])
    },
    freehandMode: function (evt) {
        return (this.freehandToggle && evt[this.freehandToggle]) ? !this.handDrawing : this.handDrawing
    },
    modifyFeature: function () {
        var index = this.line.geometry.components.length - 1;
        this.line.geometry.components[index].x = this.point.geometry.x;
        this.line.geometry.components[index].y = this.point.geometry.y;
        this.line.geometry.components[index].clearBounds();
        this.resetBezierArrow();
    },
    drawFeature: function () {
        this.layer.drawFeature(this.bezierArrow, this.symbol);
        //this.layer.drawFeature(this.line, this.symbol);
        this.layer.drawFeature(this.point, this.symbol);
    },
    getGeometry: function () {
        var geometry = this.bezierArrow.geometry;
        if (this.multi) {
            geometry = new NGeometry.MultiLineString([geometry])
        }
        return geometry
    },
    mousedown: function (evt) {
        if (!NEvent.isRightClick(evt)) {
            if (this.lastDown && this.lastDown.equals(evt.xy)) {
                return false
            }

            if (this.lastDown == null) {
                if (this.persist) {
                    this.disposeFeature()
                }
                this.createFeature()
            }
            this.mouseDown = true;
            this.lastDown = evt.xy;
            var latlng = this.control.map.pixelToWorld(evt.xy);
            this.point.geometry.x = latlng.lon;
            this.point.geometry.y = latlng.lat;
            this.point.geometry.clearBounds();
            if ((this.lastUp == null) || !this.lastUp.equals(evt.xy)) {
                this.addPoint()
            }
            this.drawFeature();
            this.drawing = true;
            return false
        } else {
            if (this.persist) {
                this.disposePoint()
            }
            this.finalize();
            return false
        }
    },
    mousemove: function (evt) {
        if (this.drawing) {
            var latlng = this.map.pixelToWorld(evt.xy);
            this.point.geometry.x = latlng.lon;
            this.point.geometry.y = latlng.lat;
            this.point.geometry.clearBounds();
            if (this.mouseDown && this.freehandMode(evt)) {
                this.addPoint()
            } else {
                this.modifyFeature()
            }
            this.drawFeature()
        }
        return true
    },
    mouseup: function (evt) {
        this.mouseDown = false;
        if (this.drawing) {
            if (this.freehandMode(evt)) {
                if (this.persist) {
                    this.disposePoint()
                }
                this.finalize()
            } else {
                if (this.lastUp == null) {
                    this.addPoint()
                }
                this.lastUp = evt.xy
            }
            return false
        }
        return true
    },
    dblclick: function (evt) {
        if (!this.freehandMode(evt)) {
            var index = this.line.geometry.components.length - 1;
            this.line.geometry.removeComponent(this.line.geometry.components[index]);
            this.resetBezierArrow();
            if (this.persist) {
                this.disposePoint()
            }
            this.finalize()
        }
        return false
    },
    _CLASS_NAME: "NDrawBezierArrowLineProcessor"
});

NBezierArrowLineTool = NObject(NTool, {
    toolType: "NBezierArrowLineTool",
    layer: null,
    callbacks: null,
    EVENT_TYPES: ["featureadded"],
    featureAdded: function () {},
    processorOptions: null,
    construct: function (layer, options) {
        if (layer != null) {
            this.layer = layer
        }
        this.EVENT_TYPES = NBezierArrowLineTool.prototype.EVENT_TYPES.concat(NTool.prototype.EVENT_TYPES);
        NTool.prototype.construct.apply(this, [options]);
        this.callbacks = NUtility.extend({
            done: this.drawFeature
        }, this.callbacks);
        this.processor = new NDrawBezierArrowLineProcessor(this, this.callbacks, this.processorOptions)
    },
    enable: function () {
        NTool.prototype.enable.apply(this, arguments);
        this.map.div.style.cursor = 'crosshair';
        if (this.layer == null) {
            this.layer = new NVectorLayer("Bezier Arrow Line Vector Layer");
            this.map.addLayers([this.layer])
        }
        return true
    },
    drawFeature: function (geometry) {
        var feature = new NVectorFeature(geometry);
        this.layer.addFeatures([feature]);
        this.featureAdded(feature);
        this.events.triggerEvent("featureadded", {
            feature: feature
        })
    },
    _CLASS_NAME: "NBezierArrowLineTool"
});

NDrawBezierArrowPolygonProcessor = NObject(NDrawPointProcessor, {
    line: null,
    bezierArrow: null,
    bDovetail: false,
    dDisPixel: 20,
    dStaPixel: 20,
    dDistance: 50000,
    dStandard: 50000,
    handDrawing: false,
    freehandToggle: 'shiftKey',
    construct: function(control, callbacks, options) {
        NDrawPointProcessor.prototype.construct.apply(this, arguments)
    },
    pixelToWorld: function(dPixel) {
        var latlng1 = this.map.pixelToWorld(new NPixel(0, 0));
        var latlng2 = this.map.pixelToWorld(new NPixel(0, dPixel));
        return Math.sqrt(Math.pow(latlng1.lon - latlng2.lon, 2) + Math.pow(latlng1.lat - latlng2.lat, 2));
    },
    createFeature: function() {
        this.dDistance = this.pixelToWorld(this.dDisPixel);
        this.dStandard = this.pixelToWorld(this.dStaPixel);
        this.bezierArrow = new NVectorFeature(new NGeometry.Collection());
        this.line = new NVectorFeature(new NGeometry.MultiPoint());
        this.point = new NVectorFeature(new NGeometry.Point());
        this.layer.addFeatures([this.line, this.point], {
            silent: true
        })
    },
    disposeFeature: function() {
        NDrawPointProcessor.prototype.disposeFeature.apply(this);
        this.line = null;
        this.bezierArrow = null;
    },
    disposePoint: function() {
        if (this.point) {
            this.layer.disposeFeatures([this.point])
        }
    },
    resetBezierArrow: function() {
        this.layer.disposeFeatures([this.bezierArrow]);
        
        this.bezierArrow.geometry = CreateBezierArrowPolygon(this.line.geometry.clone().components, this.dDistance, this.dStandard,
        8.0 * Math.PI / 180.0, 30.0 * Math.PI / 180.0, this.bDovetail);
        this.layer.addFeatures([this.bezierArrow]);
    },
    addPoint: function() {
        this.line.geometry.addComponent(this.point.geometry.clone(), this.line.geometry.components.length);
        this.resetBezierArrow();
        this.callback("point", [this.point.geometry, this.getGeometry()])
    },
    freehandMode: function(evt) {
        return (this.freehandToggle && evt[this.freehandToggle]) ? !this.handDrawing : this.handDrawing
    },
    modifyFeature: function() {
        var index = this.line.geometry.components.length - 1;
        this.line.geometry.components[index].x = this.point.geometry.x;
        this.line.geometry.components[index].y = this.point.geometry.y;
        this.line.geometry.components[index].clearBounds();
        this.resetBezierArrow();
    },
    drawFeature: function() {
        this.layer.drawFeature(this.bezierArrow, this.symbol);
        //this.layer.drawFeature(this.line, this.symbol);
        this.layer.drawFeature(this.point, this.symbol);
    },
    getGeometry: function() {
        var geometry = this.bezierArrow.geometry;
        if (this.multi) {
            geometry = new NGeometry.MultiLineString([geometry])
        }
        return geometry
    },
    mousedown: function(evt) {
        if (!NEvent.isRightClick(evt)) {
            if (this.lastDown && this.lastDown.equals(evt.xy)) {
                return false
            }

            if (this.lastDown == null) {
                if (this.persist) {
                    this.disposeFeature()
                }
                this.createFeature()
            }
            this.mouseDown = true;
            this.lastDown = evt.xy;
            var latlng = this.control.map.pixelToWorld(evt.xy);
            this.point.geometry.x = latlng.lon;
            this.point.geometry.y = latlng.lat;
            this.point.geometry.clearBounds();
            if ((this.lastUp == null) || !this.lastUp.equals(evt.xy)) {
                this.addPoint()
            }
            this.drawFeature();
            this.drawing = true;
            return false
        } else {
            if (this.persist) {
                this.disposePoint()
            }
            this.finalize();
            return false
        }
    },
    mousemove: function(evt) {
        if (this.drawing) {
            var latlng = this.map.pixelToWorld(evt.xy);
            this.point.geometry.x = latlng.lon;
            this.point.geometry.y = latlng.lat;
            this.point.geometry.clearBounds();
            if (this.mouseDown && this.freehandMode(evt)) {
                this.addPoint()
            } else {
                this.modifyFeature()
            }
            this.drawFeature()
        }
        return true
    },
    mouseup: function(evt) {
        this.mouseDown = false;
        if (this.drawing) {
            if (this.freehandMode(evt)) {
                if (this.persist) {
                    this.disposePoint()
                }
                this.finalize()
            } else {
                if (this.lastUp == null) {
                    this.addPoint()
                }
                this.lastUp = evt.xy
            }
            return false
        }
        return true
    },
    dblclick: function(evt) {
        if (!this.freehandMode(evt)) {
            var index = this.line.geometry.components.length - 1;
            this.line.geometry.removeComponent(this.line.geometry.components[index]);
            this.resetBezierArrow();
            if (this.persist) {
                this.disposePoint()
            }
            this.finalize()
        }
        return false
    },
    _CLASS_NAME: "NDrawBezierArrowPolygonProcessor"
});

NBezierArrowPolygonTool = NObject(NTool, {
    toolType: "NBezierArrowPolygonTool",
    layer: null,
    callbacks: null,
    EVENT_TYPES: ["featureadded"],
    featureAdded: function () {},
    processorOptions: null,
    construct: function (layer, options) {
        if (layer != null) {
            this.layer = layer
        }
        this.EVENT_TYPES = NBezierArrowLineTool.prototype.EVENT_TYPES.concat(NTool.prototype.EVENT_TYPES);
        NTool.prototype.construct.apply(this, [options]);
        this.callbacks = NUtility.extend({
            done: this.drawFeature
        }, this.callbacks);
        this.processor = new NDrawBezierArrowPolygonProcessor(this, this.callbacks, this.processorOptions)
    },
    enable: function () {
        NTool.prototype.enable.apply(this, arguments);
        this.map.div.style.cursor = 'crosshair';
        if (this.layer == null) {
            this.layer = new NVectorLayer("Bezier Arrow Polygon Vector Layer");
            this.map.addLayers([this.layer])
        }
        return true
    },
    drawFeature: function (geometry) {
        var feature = new NVectorFeature(geometry);
        this.layer.addFeatures([feature]);
        this.featureAdded(feature);
        this.events.triggerEvent("featureadded", {
            feature: feature
        })
    },
    _CLASS_NAME: "NBezierArrowPolygonTool"
});