const getRouteInfo = async (index) => {
    const route = await fetch("./route.json").then((response) =>
        response.json()
    );
    return route[index];
};
let polylineArrayForPC = [];        // PC에서 폴리라인 담을 배열
let markerArrayForPC = [];          // PC에서 마커를 담을 배열
let polylineArrayForMobile = [];    // 모바일에서 폴리라인을 담을 배열
let markerArrayForMobile = [];      // 모바일에서 마커를 담을 배열

// 자전거 도로 클릭시 변화하는 코드를 함수로 정의
function addPolylineEvents(polyline, index) {
    const highlight = () => polyline.setOptions({ strokeWeight: 20 });
    const unhighlight = () => polyline.setOptions({ strokeWeight: 6 });

    naver.maps.Event.addListener(polyline, "mouseover", highlight);
    naver.maps.Event.addListener(polyline, "mouseout", unhighlight);
    naver.maps.Event.addListener(polyline, "mousedown", highlight);
    naver.maps.Event.addListener(polyline, "mouseup", unhighlight);

    // 인덱스를 가지고 폴리라인 클릭 이벤트 추가
    naver.maps.Event.addListener(polyline, "touchstart", function () {
        displayRouteInfo(index);
    }); 
    naver.maps.Event.addListener(polyline, "click", function () {
        displayRouteInfo(index);
    }); 
}
function addMarkers(map, polylinePath, index) {

    let midIndex = Math.floor(polylinePath.length / 2); // polylinepath 중간에 마커를 찍음
    let midMarker = new naver.maps.Marker({
        position: polylinePath[midIndex],
        map: map,
        visible: false                                  // 처음 만들어질 땐 invisible
    });

    if (map.id === 'PC') {
        markerArrayForPC.push(midMarker);
    }
    else if (map.id === 'Mobile') {
        markerArrayForMobile.push(midMarker);
    }
    // 인덱스를 가지고 마커 클릭 이벤트 추가
    naver.maps.Event.addListener(midMarker, "click", function () {
        displayRouteInfo(index);
    });
}

//폴리라인, 마커 클릭시 실행되는 함수
function displayRouteInfo(index) {
    getRouteInfo(index).then((res) => {
        const {
            gugunNm,
            startSpot,
            endSpot,
            total,
            url,
            attraction,
            link,
            describe,
        } = res;

        document.querySelectorAll("#image").forEach((element) => {
            element.src = url;
        });
        document.querySelectorAll("#attraction").forEach((element) => {
        element.innerHTML = attraction;
        });
        document.querySelectorAll("#link").forEach((element) => {
        element.href = link;
        });
        document.querySelectorAll("span.gugunNm").forEach((element) => {
            element.innerHTML = gugunNm;                                                
        });

        // 부산광역시 ...구/군 제거 로직
        let start = startSpot.replace("부산광역시 ", "").split(" ");
        if (start[0].includes("구") || start[0].includes("군")) {
            start.shift();
            start = start.join(" ");
        }

        let end = endSpot.replace("부산광역시 ", "").split(" ");
        if (end[0].includes("구") || end[0].includes("군")) {
            end.shift();
            end = end.join(" ");
        }

        document.querySelectorAll("span.startSpot").forEach((element) => {
            element.innerHTML = startSpot;
        })
        document.querySelectorAll("span.endSpot").forEach((element) => {
            element.innerHTML = endSpot;
        })
        document.querySelectorAll("span.total").forEach((element) => {
            element.innerHTML = total;
        })
        document.querySelectorAll("p.describe").forEach((element) => {
            element.innerHTML = describe;
        })
    });
}

function addPolyline(map, polylinePath, index) {

    getRouteInfo(index).then((res) => {
        const {
            scene
        } = res;

        // 테마에 따른 색상 값을 받는 변수
        /*공원, 강변, 바다, 도심*/
        let colorValue = "";
        if (scene === "공원") {
            colorValue = "forestgreen"      // forestgreen
        }
        else if (scene === "강변") {
            colorValue = "cyan"      // mediumturquoise	
        }
        else if (scene === "바다") {
            colorValue = "midnightblue"      // midnightblue
        }
        
        else if (scene === "도심") {
            colorValue = "cadetblue"      
        }

        // 폴리라인 추가
        var polyline = new naver.maps.Polyline({
            path: polylinePath,
            strokeColor: colorValue,
            strokeOpacity: 0.8,
            strokeWeight: 6,
            zIndex: 2,
            clickable: true,
            map: map,
        });
        // polyline 객체를 배열에 추가
        if (map.id === 'PC') {
            polylineArrayForPC.push(polyline);
        }
        else if (map.id === 'Mobile') {
            polylineArrayForMobile.push(polyline);
        }
        // 폴리라인 이벤트 추가
        addPolylineEvents(polyline, index); //polyline-data의 해당 인덱스 Json값 불러오기
        
        //================================================================================        
    });
}
var Drawing = function(buttons) { //생성자
    this.$btnDrawing = buttons.drawing; //자전거도로 그리기 버튼
    this.$btnDelete = buttons.delete; //그렸던 도로 개별 삭제 버튼
    this._mode = null;
    this._polylines = []; //그리기로 그려진 폴리라인을 담을 배열
    this._ms = []; // 그리기로 그려진 마일스톤을 폴리라인 단위로 담을 배열
    this._currentMs = []; // 현재 그리기 중인 마일스톤
    this._bindDOMEvents(); //DOM이벤트 바인딩
};

$.extend(Drawing.prototype, {
    constructor: Drawing, 

    setMap: function(map) {
        if (this.map) {
            this._unbindMap(this.map);
        }

        this.map = map;
        if (map) {
            this._bindMap(map);
        }
    },

    startMode: function(mode) {
        if (!mode) return;
        if (mode === 'drawing') {
            this._startDrawing();
        }
    },

    _startDrawing: function() {
        var map = this.map;

        this._drawingListeners = [
            naver.maps.Event.addListener(map, 'click', this._onClickDrawing.bind(this))
        ];
        map.setCursor("url('rule.cur'), default");
    },

    _finishDrawing: function() { //그리기가 끝날 때를 처리하는 함수
        naver.maps.Event.removeListener(this._drawingListeners);
        delete this._drawingListeners;

        $(document).off('mousemove.drawing');

        if (this._guideline) {
            this._guideline.setMap(null);
            delete this._guideline;
        }

        if (this._polyline) {
            var path = this._polyline.getPath(),
                lastCoord = path.getAt(path.getLength() - 1),
                distance = this._polyline.getDistance();
            if (lastCoord) { //마지막 총 거리를 마커로 표시함 
                this._addMileStone(lastCoord, this._fromMetersToText(distance), {
                    'font-size': '14px',
                    'font-weight': 'bold',
                    'color': '#f00'
                });
            }
            this._polylines.push(this._polyline); // 배열에 완성된 폴리라인을 추가
                this._ms.push(this._currentMs); // 배열에 마일스톤 추가
                this._currentMs = []; // 현재 마일스톤 초기화
                delete this._polyline;
        }

        this.$btnDrawing.removeClass('control-on').blur();
        this.$btnDrawing.text('자전거 도로 그리기');
        this.map.setCursor('auto');

        delete this._lastDistance;
        this._mode = null;
    },

    finishMode: function(mode) { 
        if (!mode) return;
        if (mode === 'drawing') {
            this._finishDrawing();
        }
    },

    _fromMetersToText: function(meters) { 
        meters = meters || 0;

        var km = 1000, //거리가 1000m 이상이면 km로 표현
            text = meters;

        if (meters >= km) {
            text = parseFloat((meters / km).toFixed(1)) + 'km';
        } else {
            text = parseFloat(meters.toFixed(1)) + 'm';
        }
        return text;
    },

    _addMileStone: function(coord, text, css) { //폴리라인 두 점마다 마일스톤으로 거리 표시
        var ms = new naver.maps.Marker({
            position: coord,
            icon: {
                content: '<div style="display:inline-block;padding:5px;text-align:center;background-color:#fff;border:1px solid #000;"><span>' + text + '</span></div>',
                anchor: new naver.maps.Point(-5, -5)
            },
            map: this.map
        });

        var msElement = $(ms.getElement());
        msElement.css('font-size', '11px');
        this._currentMs.push(ms); //생성된 마일스톤은 배열에 임시로 담김
    },
//
    _onClickDrawing: function(e) { //클릭해서 도로를 그리는 함수
        var map = this.map,
            coord = e.coord;

        if (!this._polyline) {
            //임시로 보여줄 점선 
            this._guideline = new naver.maps.Polyline({
                strokeColor: '#f00',
                strokeWeight: 5,
                strokeStyle: [4, 4],
                strokeOpacity: 0.6,
                path: [coord],
                map: map
            });

            $(document).on('mousemove.drawing', this._onMouseMoveDrawing.bind(this)); //점선에서 클릭하면 실선으로 표시
            this._drawingListeners.push(naver.maps.Event.addListener(map, 'rightclick', this._finishDrawing.bind(this)));
            this._polyline = new naver.maps.Polyline({
                strokeColor: '#f00',
                strokeWeight: 5,
                strokeOpacity: 0.8,
                path: [coord],
                map: map
            });

            this._lastDistance = this._polyline.getDistance();
        } else {
            this._guideline.setPath([e.coord]);
            this._polyline.getPath().push(coord);

            var distance = this._polyline.getDistance();

            this._addMileStone(coord, this._fromMetersToText(distance - this._lastDistance));

            this._lastDistance = distance;
        }
    },

    _onMouseMoveDrawing: function(e) { //마우스 움직임 처리
        var map = this.map,
            proj = this.map.getProjection(),
            coord = proj.fromPageXYToCoord(new naver.maps.Point(e.pageX, e.pageY)),
            path = this._guideline.getPath();

        if (path.getLength() === 2) {
            path.pop();
        }

        path.push(coord);
    },
    _bindMap: function(map) {},

    _unbindMap: function() {
        this.unbindAll();
    },

    _bindDOMEvents: function() {
        this.$btnDrawing.on('click.drawing', this._onClickButton.bind(this, 'drawing'));
        //자전거도로 그리기 버튼 클릭 시 _onclickButton 실행
        this.$btnDelete.on('click.delete', this._deleteOne.bind(this)); 
        //삭제 버튼 클릭 시 _deleteAll 실행
    },
    _deleteOne: function(e) { //그렸던 개별 자전거 도로를 하나씩 지우는 버튼
        e.preventDefault();

        if (this._polylines.length > 0) {
            var lastPolyline = this._polylines.pop(); //배열에서 마지막 요소만 빼서 
            lastPolyline.setMap(null); //비활성화 시킴
        }

        if (this._ms.length > 0) {
            var lastMilestones = this._ms.pop(); //배열에서 마지막 요소만 빼서 
            for (var i = 0; i < lastMilestones.length; i++) {
                lastMilestones[i].setMap(null); //비활성화 시킴
            }
        }

        this._clearMode(this._mode);
    },
    _onClickButton: function(newMode, e) { //자전거 도로 그리기 버튼 
        e.preventDefault();

        var btn = $(e.target),
            map = this.map,
            mode = this._mode;

            if (btn.hasClass('control-on')) {
                btn.removeClass('control-on');
                btn.text('자전거도로 그리기'); // 모드 비활성화 시 텍스트 변경
            } else {
                btn.addClass('control-on');
                btn.text('취소'); // 모드 활성화 시 텍스트 변경
            }

        this._clearMode(mode);

        if (mode === newMode) {
            this._mode = null;
            return;
        }

        this._mode = newMode;

        this.startMode(newMode);
    },
    _clearMode: function(mode) { //그리기가 끝날 때 처리
        if (!mode) return;
        
        if (mode === 'drawing') {
            if (this._polyline) {
                this._polyline.setMap(null);
                delete this._polyline;
            }
            this._finishDrawing();
            if (this._currentMs) {
                for (var i = 0, ii = this._currentMs.length; i < ii; i++) {
                    this._currentMs[i].setMap(null);
                }
                this._currentMs = [];
            }
        }
    }
});

function addBikeRoute(map, polylinePath, index) {
    addPolyline(map, polylinePath, index);
    addMarkers(map, polylinePath, index);
}

let desktopMap, mobileMap;
let bicycleLayer = new naver.maps.BicycleLayer(); // 자전거 레이어 표현 변수

// pastZoom: trigger 전의 줌 레벨, currentZoom: trigger 후의 줌 레벨
function togglePolylineMarkerVisibility(zoomThreshold, pastZoom, currentZoom) {
    // map에 따른 array 객체 설정
    let currentPolylineArray = [];
    let currentMarkerArray = [];
    if (($(window).width() <= 768)) {   // 모바일일 때 array 설정 
        currentPolylineArray = polylineArrayForMobile;
        currentMarkerArray = markerArrayForMobile;
    }
    else {                              // PC일 때 array 설정
        currentZoom = desktopMap.getZoom();
        currentPolylineArray = polylineArrayForPC;
        currentMarkerArray = markerArrayForPC;
    }

    // zoomThreshold값을 기준으로 current값과 past값은 반대에 있어야 함

    // 폴리라인 -> 마커
    if (currentZoom < zoomThreshold && pastZoom >= zoomThreshold) { //줌 레벨에 따라 자전거도로 와 마커 중 하나만 활성화됨
        
        // PC
        currentMarkerArray.forEach((marker, index) => {
            marker.setVisible(currentPolylineArray[index].getVisible());                       // 폴리라인의 현재 필터링 상태(visible 값)을 marker에 적용
        });                 
        currentPolylineArray.forEach(polyline => polyline.setVisible(false));                  // 폴리라인은 안 보이게 만듦   

        
        
    } 
    // 마커 -> 폴리라인
    else if (currentZoom >= zoomThreshold && pastZoom < zoomThreshold) {

        // PC
        currentPolylineArray.forEach((polyline, index) => {
            polyline.setVisible(currentMarkerArray[index].getVisible());                       // 마커의 현재 필터링 상태(visible 값)을 폴리라인에 적용
        }); 
        currentMarkerArray.forEach(marker => marker.setVisible(false));

    }
}

function initMap() {
    var mapOptions = {
        center: new naver.maps.LatLng(35.18097447459887, 129.11777658205753),
        zoom: 13, //초기 줌 레벨
    };

    // 데스크톱 및 모바일 버전 지도 변수 초기화
    desktopMap = new naver.maps.Map("map-desktop", mapOptions);
    desktopMap.id = 'PC';
    mobileMap = new naver.maps.Map("map-mobile", mapOptions);
    mobileMap.id = 'Mobile'

    var desktopDrawings = new Drawing({ //desktop 그리기 기능 
        drawing: $('#drawing-desktop'),
        delete: $('#delete-desktop'),
    });
    
    var mobileDrawings = new Drawing({ //mobile 그리기 기능
        drawing: $('#drawing-mobile'),
        delete: $('#delete-mobile'),
    });
    
    desktopDrawings.setMap(desktopMap);
    mobileDrawings.setMap(mobileMap);

    // 자전거 레이어 및 폴리라인 추가
    const addMapLayers = (map) => {
        bicycleLayer.setMap(map);

        for (let i = 0; i < bikeRoad.length; i++) {
            const road = bikeRoad[i];
            addBikeRoute(map, road, i);
        }
        
        let pastZoom = map.getZoom();                                                   // 초기 pastZoom 설정
        naver.maps.Event.addListener(map, "zoom_changed", () => {                       //줌 배율에 따라 마커 또는 도로 표시
            let currentZoom = map.getZoom();                                            // trigger 발생ㅅ하면 currentZoom 갱신
            togglePolylineMarkerVisibility(13, pastZoom, currentZoom);                  // 줌 임계값이 13보다 크면(줌이 더 되면) 폴리라인, 작으면(줌이 덜 되면) 마커
            pastZoom = currentZoom;                                                     // pastZoom 갱신
        });
    };
    
    naver.maps.Event.once(desktopMap, "init", () => addMapLayers(desktopMap));
    naver.maps.Event.once(mobileMap, "init", () => addMapLayers(mobileMap));
}

$(document).ready(initMap);

$(window).resize(() => {
    if ($(window).width() <= 768) {
        naver.maps.Event.trigger(mobileMap, "resize");
    } else {
        naver.maps.Event.trigger(desktopMap, "resize");
    }
});

// 필터 관련 코드 시작
$("#거리순").change(function () {
    let filters = [];
    
    if (($(window).width() <= 768)) {   // 모바일일 때
        $(".filter-comboBox").each(function () {
            filters.push($(this).val());
        });
    }
    else {
        $(".combo-box").each(function () {
            filters.push($(this).val());
        });
    }
    
    mapFilter(filters);
});

$("#장소").change(function () {
    let filters = [];

    if (($(window).width() <= 768)) {   // 모바일일 때
        $(".filter-comboBox").each(function () {
            filters.push($(this).val());
        });
    }
    else {
        $(".combo-box").each(function () {
            filters.push($(this).val());
        });
    }

    mapFilter(filters);
});

$("#풍경").change(function () {
    let filters = [];

    if (($(window).width() <= 768)) {   // 모바일일 때
        console.log("mobile filter started");
        $(".filter-comboBox").each(function () {
            filters.push($(this).val());
        });
    }
    else {
        $(".combo-box").each(function () {
            filters.push($(this).val());
        });
    }

    mapFilter(filters);
});

// 모바일과 PC는 따로놀아야됨
function mapFilter(filters) {
    // map에 따른 array 객체와 currentZoom 설정
    let currentZoom;                    // 현재 줌 레벨 받아오기
    let currentPolylineArray = [];
    let currentMarkerArray = [];
    if (($(window).width() <= 768)) {   // 모바일일 때 array 설정
        currentZoom = mobileMap.getZoom();  
        console.log("mobile zoom level: " + currentZoom);
        currentPolylineArray = polylineArrayForMobile;
        currentMarkerArray = markerArrayForMobile;
    }
    else {                              // PC일 때 array 설정
        currentZoom = desktopMap.getZoom();
        currentPolylineArray = polylineArrayForPC;
        currentMarkerArray = markerArrayForPC;
    }
               
    for (let i = 0; i < bikeRoad.length; i++) {
        getRouteInfo(i).then((res) => {
            const { gugunNm, total, scene } = res;
            // 필터에서 받은 값
            const distRaw = filters[0];
            const placement = filters[1];
            const scenary = filters[2];

            // distance logic 시작
            const totalDist = Number(total);
            let distance = distRaw.split(" ");
            const startDist = Number(distance[0]);
            const endDist = Number(distance[2]);

            // data의 total 값이 포함되는가를 묻는 로직
            let isContain = false;
            if (distance[1] === "-") {
                isContain = Boolean(
                    totalDist >= startDist && totalDist <= endDist
                );
            } else if (distance[1] === "~") {
                isContain = Boolean(totalDist >= startDist);
            }

            // 줌 임계값이 14보다 크면(줌이 더 되면) 폴리라인, 작으면(줌이 덜 되면) 마커
            // 필터링 로직
            if (currentZoom >= 13) {    // 폴리라인 필터링 (줌 레벨 13 이상)
                if (
                    (distRaw === "" || isContain) &&
                    (placement === "" || placement === gugunNm) &&
                    (scenary === "" || scenary === scene)
                ) {
                    currentPolylineArray[i].setVisible(true);
                    
                } else {
                    currentPolylineArray[i].setVisible(false);
                }
            }
            else {                      // 마커 필터링 (줌 레벨 13 미만)
                if (
                    (distRaw === "" || isContain) &&
                    (placement === "" || placement === gugunNm) &&
                    (scenary === "" || scenary === scene)
                ) {
                    currentMarkerArray[i].setVisible(true);
                } else {
                    currentMarkerArray[i].setVisible(false);
                }
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const toggleButton = document.getElementById("mobile-container");
    const mobileAside = document.getElementById("mobile-aside");
    toggleButton.addEventListener("click", function() {
        if (mobileAside.classList.contains("open")) {
            mobileAside.classList.remove("open");
            toggleButton.classList.remove("open");
        } else {
            mobileAside.classList.add("open");
            toggleButton.classList.add("open");
        }
    });
});