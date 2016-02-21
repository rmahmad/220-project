$(document).ready(function() {

  // Constants
  //
  var margin = {top: 20, right: 20, bottom: 30, left: 40};
  var width = $("#content").width() - margin.right - margin.left;
  var height = 600;
  var barHeight = 24;
  var timelineHeight = 42;
  var data;
  var min, max;

  var scaleX = d3.scale.linear()
    .domain([0,3600])
    .range([0, width]);

  var scaleY = d3.scale.linear()
    .domain([0,1500])
    .range([height, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
    .scale(scaleX)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(scaleY)
    .orient("left");

  var tooltip = d3.select("#content")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("width","300px")
    .style("height","330px")
    .style("font","12px sans-serif")
    .style("border","2px solid red")
    .style("background", "black")
    .style("visibility", "hidden");
  var tooltipText = tooltip.append("div")
    .style("padding-top", "7px")
    .style("text-align", "center")
    .style("height", "30px")
    .style("border-bottom", "1px solid red");
  var imgMaskThingVariable = tooltip.append("img").attr("id", "tooltip-image");
  var clickDot = tooltip.append("div")
    .attr("id", "click-dot")
    .attr("class", "dot")
    .style("width", "10px")
    .style("height", "10px")
    .style("-webkit-border-radius", "5px")
    .style("-moz-border-radius", "5px")
    .style("border", "1px solid black")
    .style("position", "relative")
    .style("background", "cyan");

  // Draw Containers
  //
  var svg = d3.select("#content").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + timelineHeight + barHeight);

  svg.append("rect")
      .attr("x", "40")
      .attr("y", "20")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#image)");

  main = svg.append("g")
    .attr("id", "graph")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // container for main compressed timeline
  //
  var timeline = main.append("g")
    .attr("transform", "translate(" + 0 + "," + (height + margin.bottom) + ")")//start @ x = 0, y = 5
    .attr("width", width)
    .attr("height", timelineHeight)
    .attr("class", "timeline");

  // background rectangle for compressed timeline
  //
  var clifford = timeline.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", barHeight)
    .attr('class', 'clifford')
    .style("fill", "pink");

  var recordingEvents = []
  var currRecordingEvent


  //----------------------------------------//
  //  Process Data                          //
  //----------------------------------------//
  d3.json("../data/extract.json", function(error, json) {
    if (error) throw error;
    data = json;

    for(var i = 0; i < data["recordings"].length; i++) {
      var el = data["recordings"][i];
      if(el.event === "Start" || el.event === "Wake" || el.event === "Unpause") {
        var start = el;
        for(; i < data["recordings"].length; i++) {
          var el = data["recordings"][i];
          if(el.event === "Exit" || el.event === "Sleep" || el.event === "Pause") {
            recordingEvents.push({"start": start, "end": el});
            break;
          }
        }
      }
    }

    min = Date.now() / 1000;
    max = 0
    filteredClicks = data["clicks"].filter(function(el) {
      return (el.x >= 0 && el.y >= 0);
    });
    currRecordingEvent = recordingEvents.length-1
    min = recordingEvents[currRecordingEvent]["start"]["time"]
    max = recordingEvents[currRecordingEvent]["end"]["time"]

    draw(data, filteredClicks, data["images"], min, max);

    drawTimeline(data, min, max);
    setupBrush(min, max, data, filteredClicks, data["images"]);
  });

  //----------------------------------------//
  //  Draw EVERYTHING                       //
  //----------------------------------------//
  function draw(data, filteredClicks, images, startTime, endTime) {
    main.selectAll(".dot").remove();
    main.selectAll(".graph-axis").remove();

    // Get selected App
    //
    var selectedApp = $(".selected").attr("app_id");

    console.log(selectedApp);
    filteredClicks = filteredClicks.filter(function(el) {
      return ((selectedApp === undefined || el.app_id == selectedApp) && 
              el.time > startTime && el.time < endTime);
    });

    filteredImages = images.filter(function(el) {
      return (el.time > startTime && el.time < endTime);
    });

    var image = filteredImages[Math.round(Math.random() * filteredImages.length)]
    svg.append("defs")
        .append("pattern")
        .attr("id", "image")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", width)
        .attr("height", height)
        .append("image")
        .attr("xlink:href", "../assets/" + image.image)
        .attr("width", 100)
        .attr("height", 100)
        .attr("x", 40)
        .attr("y", 20);
    main.append("g")
      .attr("class", "axis graph-axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6);

    main.append("g")
      .attr("class", "axis graph-axis")
      .call(yAxis)
      .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em");

    main.selectAll(".dot")
      .data(filteredClicks)
      .enter().append("svg:circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return scaleX(d.x); })
      .attr("cy", function(d) { return scaleY(d.y); })
      .style("fill", function(d) { return color(d.app_id); })
      .style("z-index", "1")
      .on('mouseover', function(d){
        var dot = $(this);
        imgMaskThingVariable
          .attr("src", function() {
            var result = $.grep(filteredImages, function(e) {return e.time >= d.time;});
            if(result.length >= 1) {
              return "../assets/" + result[0].image;
            }
            else {
              var result = $.grep(filteredImages, function(e) {return e.time <= d.time;});
              return "../assets/" + result[0].image;
            }
          })
          .style("top", function() {
            return (30 - ($(this).height() - d.y - 150)) + "px";
          })
          .style("left", function() {
            return (0 - (d.x - 150)) + "px";
          })
          .style("position", "absolute")
          .style("clip", function() {
            var leftClip = d.x - 150;
            var rightClip = d.x + 146;
            var topClip = $(this).height() - d.y - 150;
            var bottomClip = $(this).height() - d.y + 146;
            return "rect(" + topClip + "px, " + rightClip + "px, " + bottomClip + "px, " + leftClip + "px)";
          });
        tooltip.style("visibility", "visible")
          .style("left", function() {
            return (dot.position().left - 150)+"px"
          })
          .style("top", function() {
            return (dot.position().top + 15)+"px"
          });
        clickDot.style("top", "140px")
          .style("left", "140px");
          tooltipText.html("<strong style='color: white;'>App: <span style='color: red;'>" + data['apps'][d.app_id-1]['name'] + "</span></strong>");
      })
      .on('mouseout', function(d){
        tooltip.style("visibility", "hidden");
      });
  }

  //----------------------------------------//
  //  Draw the Timeline with BARS           //
  //----------------------------------------//
  function drawTimeline(data, timeBegin, timeEnd) {
    timeline.selectAll(".cbar").remove()
    timeline.selectAll(".brush").remove()
    drawTimelineAxis(timeBegin, timeEnd);

    var tmpClicks = filteredClicks.filter(function(el) {
      return (el.time > timeBegin && el.time < timeEnd);
    });

    var timeScale = d3.scale.linear()
      .domain([timeBegin, timeEnd])
      .range([0, width]);

    //timeline.selectAll("g").remove();

		cbars = timeline.append("g").selectAll(".cbar")
			.data(tmpClicks);

		cbars.enter().append("rect")
			.attr("class", 'cbar')
			.attr("x", function(d) {return timeScale(d.time);})
			.attr("y", 0)
			.attr("width", function(d) {return ( 2 )}) 
			.attr("height", barHeight)
			.style("fill", function(d) {return color(d.app_id);});
			//.on("mouseover", function(d){ barMouseover(d); })
			//.on("mousemove", function(d){ barMousemove(); })
			//.on("mouseout", function(d){ barMouseout(); });

		cbars.exit().remove();

    // Get the active apps during this time window
    //
    var filteredApps = new Set();
    tmpClicks.forEach(function(d) {
      if (d.app_id > 0) {
        filteredApps.add(data['apps'][d.app_id-1])
      }
    });

    d3.selectAll(".app-filter").remove();
    filteredApps.forEach(function(d) {
      $("#app-list").append("<span app_id='" + d.id + "' class='app-filter'>" + d.name + "</span>");
    });

  }

  // -------------------------------------------------
  // draw main timeline axis
  // -------------------------------------------------
  function drawTimelineAxis(min, max) {
    timeline.selectAll(".time.axis").remove()
    var t1 = new Date(min*1000);
    var t2 = new Date(max*1000);

    var xScale = d3.time.scale()
      .domain([t1, t2])
      .range([0, width]);

    var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient("bottom");

    timeline.append("g") //redraw the timeline axis
      .attr("class", "time axis")
      .attr("transform", "translate("+0+"," + (barHeight + 1) + ")")
      .call(xAxis)
      .selectAll("text") //move text for tick marks
      .attr("y", 12)
      .attr("x", 0)
      .style("text-anchor", "center")
      .style("fill", "#666");
  }

  // -------------------------------------------------
  // setup brush elemetns
  // -------------------------------------------------
  function setupBrush(timeBegin, timeEnd, data, filteredClicks, images) {
    // Setup the scale for the brush
    //
    var xscale = d3.scale.linear()
      .domain([timeBegin, timeEnd])
      .range([0, width]);

    // svg brush elements
    //
    brush = d3.svg.brush()
      .x(xscale) //xscale of the brush is the x scale of the chart
      .on("brush", function() {
        updateBrushed(data, filteredClicks, images);}) //updateBrushed) //<--- on BRUSH event, only expanded timeline is redrawn
      //.on("brushend",brushEnd); //<-- on BRUSHEND, expanded redrawn to date frame if brush is empty

    var area = timeline.append("g")
      .attr("class", "brush")
      .call(brush)
      .selectAll("rect")
      .attr("y", 0)
      .attr("height", barHeight + 2);
  }

  // -------------------------------------------------
  // redraws plotted points based on brush
  // -------------------------------------------------
  function updateBrushed(data, filteredClicks, images){

    // console.log("tryingtoupdate brush");
    minExtent = brush.extent()[0];
    maxExtent = brush.extent()[1];

    console.log("minExtent: " + minExtent);
    console.log("maxExtent: " + maxExtent);
    if(minExtent == maxExtent) {
      minExtent = recordingEvents[currRecordingEvent]["start"]["time"]
      maxExtent = recordingEvents[currRecordingEvent]["end"]["time"]
    }

    draw(data, filteredClicks, images, minExtent, maxExtent);
  }

  // -------------------------------------------------
  // redraws expanded if brush is empty
  // -------------------------------------------------
  function brushEnd(){
    //if the brush is empty, redraw the timeline based on date
    if(brush.empty()){ renderTimeline();}
  }

  $(".recording-nav").click(function() {
    currRecordingEvent = $(this).attr("id") === "prev" ? currRecordingEvent - 1 : currRecordingEvent + 1;
    min = recordingEvents[currRecordingEvent]["start"]["time"]
    max = recordingEvents[currRecordingEvent]["end"]["time"]

    draw(data, filteredClicks, data["images"], min, max);
    drawTimeline(data, min, max);
    setupBrush(min, max, data, filteredClicks, data["images"]);
  });

  $(".content").on("click", ".app-filter", function() {
    if ($(this).hasClass("selected")) {
      $(".selected").removeClass("selected");
    } else {
      $(".selected").removeClass("selected");
      $(this).addClass("selected");
    }
    draw(data,filteredClicks, data["images"], min, max);
  });
});
