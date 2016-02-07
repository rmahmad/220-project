$(document).ready(function() {

  // Constants
  //
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 1800,
    height = 600;

  var scaleX = d3.scale.linear()
    .domain([0,3600])
    .range([0, 1800]);

  var scaleY = d3.scale.linear()
    .domain([0,1200])
    .range([600, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
    .scale(scaleX)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(scaleY)
    .orient("left");

  var max = {x: 1800, y: 600}
  var imgUrl = "../assets/PICTURE.jpg";

  // Draw Containers
  //
  var main = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 100);

  main.append("defs")
    .append("pattern")
    .attr("id", "image")
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('patternTransform', 'translate(40, 20)')
    .attr("width", max.x)
    .attr("height", max.y)
    .append("image")
    .attr("xlink:href", imgUrl)
    .attr("width", max.x)
    .attr("height", max.y);

  main.append("rect")
    .attr("x", "40")
    .attr("y", "20")
    .attr("width", max.x)
    .attr("height", max.y)
    .attr("fill", "url(#image)");

  main = main.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // container for main compressed timeline
  //
  var timeline = main.append("g")
    .attr("transform", "translate(" + 0 + "," + (max.y + 30) + ")")//start @ x = 0, y = 5
    .attr("width", width)
    .attr("height", 42)
    .attr("class", "timeline");

  // background rectangle for compressed timeline
  //
  var clifford = timeline.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", 42)
    .attr('class', 'clifford')
    .style("fill", "gray");


  var startTime = d3.select("body").append("input").attr("id", "startTime");
  var endTime = d3.select("body").append("input").attr("id", "endTime");
  var button = d3.select("body").append("button").attr("id", "BUTTON").text("CLICK ME");
  var startTimeVal = 0;
  var endTimeVal = Date.now() / 1000;

  d3.json("../data/extract.json", function(error, data) {
    if (error) throw error;

    var min = Date.now() / 1000;
    var max = 0
    filteredClicks = data['clicks'].filter(function(el) {
      if(el.time < min) {
        min = el.time;
      }
      if(el.time > max) {
        max = el.time
      }
      return (el.x >= 0 && el.y >= 0);
    });
    $("#startTime").val(Math.floor(min));
    $("#endTime").val(Math.ceil(max));

    draw(data, filteredClicks);

    $("#BUTTON").on("click", function() {
      draw(data, filteredClicks);
    });
  });

  function draw(data, filteredClicks) {
    main.selectAll(".dot").remove();

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        return "<strong>App:</strong> <span style='color:red'>" + data['apps'][d.app_id-1]['name'] + "</span>";
      })
    main.call(tip)

      filteredClicks = filteredClicks.filter(function(el) {
        return (el.time > $("#startTime").val() && el.time < $("#endTime").val());
      });

    // data.forEach(function(d) {
    //   d.sepalLength = +d.sepalLength;
    //   d.sepalWidth = +d.sepalWidth;
    // });
    //
    // x.domain(d3.extent(data, function(d) { return d.sepalWidth; })).nice();
    // y.domain(d3.extent(data, function(d) { return d.sepalLength; })).nice();

    main.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6);

    main.append("g")
      .attr("class", "y axis")
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
      .attr("blahx", function(d) {return d.x})
      .attr("blahy", function(d) {return d.y})
      .attr("blahapp", function(d) {return data['apps'][d.app_id]['name']})
      .attr("blahappid", function(d) {return d.app_id})
      .attr("blahtime", function(d) {return d.time})
      .style("fill", function(d) { return color(d.app_id); })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    drawTimelineAxis();
  }

  // -------------------------------------------------
  // setup brush elemetns
  // -------------------------------------------------
  function setupBrush(){
    //get start and end time of the day we are viewing
    selectedDate = $("#datepicker").datepicker("getDate");
    timeBegin = Date.parse(selectedDate)/1000.0 //+ selectedDate.getTimezoneOffset()*60.0;
    timeEnd = timeBegin + 24*60*60; //show one day of data

    //LINEAR TIME SCALE for selected day <-> page width
    var x = d3.scale.linear()
      .domain([timeBegin, timeEnd])
      .range([m[3],w]);

    //svg brush elements
    brush = d3.svg.brush()
      .x(x) //xscale of the brush is the x scale of the chart
      // .extent([timeBegin, timeEnd]) //extent is current time range
      .on("brush", updateBrushed) //<--- on BRUSH event, only expanded timeline is redrawn
      .on("brushend",brushEnd); //<-- on BRUSHEND, expanded redrawn to date frame if brush is empty

    var area = main.append("g")
      .attr("class", "brush")
      .call(brush)
      .selectAll("rect")
      .attr("y", 4)
      .attr("height", barHeight + 2);
  }

  // -------------------------------------------------
  // redraws expanded based on brush
  // -------------------------------------------------
  function updateBrushed(){

    // console.log("tryingtoupdate brush");
    minExtent = brush.extent()[0];
    maxExtent = brush.extent()[1];

    //LINEAR SCALE for number of apps
    var y = d3.scale.linear()
      .domain([0, laneLength])
      .range([0, laneLength * (barHeight + 2 * eBarPadding)]);

    var x = d3.scale.linear()
      .domain([timeBegin, timeEnd])
      .range([m[3],w]);

    //scale for brushed timeline
    var xb = d3.scale.linear()
      .domain([minExtent, maxExtent])
      .range([0, w]);

    //get new data based on brush extents
    filteredApps = items.filter(function (el) {
      return (el.start <= maxExtent && el.start >= minExtent) ||
      (el.end <= maxExtent && el.end >= minExtent);
    });
    console.log(" ");
    console.log("brush filtered: " + filteredApps.length);
    console.log("timeBegin: " + timeBegin);
    console.log("minExtentL " + Math.round(minExtent));
    console.log("timeEnd: " + timeEnd);
    console.log("maxExtent: " + Math.round(maxExtent));
    console.log("-----");

    eTimeline.selectAll(".ebarContainer").remove(); //remove ebars

    var ebars = eTimeline.append("g")
      .attr("class","ebarContainer")
      .selectAll(".ebar")
      .data(filteredApps, function(d) {return d.id; });

    //draw the actual expanded timeline bars
    ebars.enter().append("rect")
      .attr("class","ebar")
      .attr("y", function(d) {return y(appTimesArray.findIndex(function(v){return v[0]==d.appid})) + eBarPadding;})
      .attr("x", function(d) {return xb(d.start);})
      .style("fill", function(d) {return timelineColors[appTimesArray.findIndex(function(v){return v[0]==d.appid}) % 12]})
      // .attr("width", function(d) {return x(timeBegin + d.end - d.start);}) //from original
      .attr("width", function(d) {return ( xb(d.end) - xb(d.start)); }) //x = value of scaled(end) - scaled(start)
      .attr("height", barHeight)
      .on("mouseover", function(d){ barMouseover(d); })
      .on("mousemove", function(d){ barMousemove(); })
      .on("mouseout", function(d){ barMouseout(); });

    //ebars.exit().remove();
  }

  // -------------------------------------------------
  // redraws expanded if brush is empty
  // -------------------------------------------------
  function brushEnd(){
    //if the brush is empty, redraw the timeline based on date
    if(brush.empty()){ renderTimeline();}
  }

  

  // -------------------------------------------------
  //draw main timeline axis
  // -------------------------------------------------
  function drawTimelineAxis(){
    var t1 = new Date(startTime);
    var t2 = new Date(t1.getTime());
    t2.setDate(t2.getDate() + 1);

    var xScale = d3.time.scale()
      .domain([t1, t2])
      .range([0, width]);

    var xAxis = d3.svg.axis()
      .scale(xScale)
      .orient("bottom");

    d3.selectAll(".axis").remove(); //remove any existing axis

    main.append("g") //redraw the timeline axis
      .attr("class", "x axis")
      .attr("transform", "translate("+0+"," + 12 + ")")
      .call(xAxis)
      .selectAll("text") //move text for tick marks
      .attr("y", 12)
      .attr("x", 0)
      .style("text-anchor", "center")
      .style("fill", "#666");
  }

});
