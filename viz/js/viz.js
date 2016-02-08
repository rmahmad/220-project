$(document).ready(function() {

  // Constants
  //
  var margin = {top: 20, right: 20, bottom: 30, left: 40};
  var width = 1800;
  var height = 600;
  var barHeight = 24;
  var timelineHeight = 42;

  var scaleX = d3.scale.linear()
    .domain([0,3600])
    .range([0, 1800]);

  var scaleY = d3.scale.linear()
    .domain([0,1500])
    .range([600, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
    .scale(scaleX)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(scaleY)
    .orient("left");

  var max = {x: 1800, y: 600}

  // Draw Containers
  //
  var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + timelineHeight + barHeight);

  svg.append("rect")
      .attr("x", "40")
      .attr("y", "20")
      .attr("width", max.x)
      .attr("height", max.y)
      .attr("fill", "url(#image)");

  main = svg.append("g")
    .attr("id", "graph")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // container for main compressed timeline
  //
  var timeline = main.append("g")
    .attr("transform", "translate(" + 0 + "," + (max.y + margin.bottom) + ")")//start @ x = 0, y = 5
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


  var startTime = d3.select("body").append("input").attr("id", "startTime");
  var endTime = d3.select("body").append("input").attr("id", "endTime");
  var button = d3.select("body").append("button").attr("id", "BUTTON").text("CLICK ME");
  var startTimeVal = 0;
  var endTimeVal = Date.now() / 1000;


  //----------------------------------------//
  //  Process Data                          //
  //----------------------------------------//
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

    draw(data, filteredClicks, data['images'], min, max);

    drawTimeline(min, max);
    setupBrush(min, max, data, filteredClicks, data['images']);

    $("#BUTTON").on("click", function() {
      draw(data, filteredClicks, data['images'], $("#startTime").val(), $("#endTime").val());
    });
  });

  //----------------------------------------//
  //  Draw EVERYTHING                       //
  //----------------------------------------//
  function draw(data, filteredClicks, images, startTime, endTime) {
    main.selectAll(".dot").remove();
    main.selectAll(".graph-axis").remove();

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        return "<strong>App:</strong> <span style='color:red'>" + data['apps'][d.app_id-1]['name'] + "</span>";
      });
    main.call(tip);

    filteredClicks = filteredClicks.filter(function(el) {
      return (el.time > startTime && el.time < endTime);
    });

    filteredImages = images.filter(function(el) {
      return (el.time > startTime && el.time < endTime);
    });

    var image = filteredImages[Math.round(Math.random() * filteredImages.length)]
    svg.append("defs")
        .append("pattern")
        .attr("id", "image")
        .attr('patternUnits', 'userSpaceOnUse')
        // .attr('patternTransform', "translate(40, 20)")
        .attr("width", max.x)
        .attr("height", max.y)
        .append("image")
        .attr("xlink:href", "../assets/" + image.image)
        .attr("width", 50)
        .attr("height", 20)
        .attr("x", 0)
        .attr("y", 0);
    console.log(scaleX(1500));
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
      .attr("blahx", function(d) {return d.x})
      .attr("blahy", function(d) {return d.y})
      .attr("blahapp", function(d) {return data['apps'][d.app_id]['name']})
      .attr("blahappid", function(d) {return d.app_id})
      .attr("blahtime", function(d) {return d.time})
      .style("fill", function(d) { return color(d.app_id); })
      .style("z-index", "1")
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

  }

  //----------------------------------------//
  //  Draw the Timeline with BARS           //
  //----------------------------------------//
  function drawTimeline(timeBegin, timeEnd) {
    drawTimelineAxis(timeBegin, timeEnd);

    var timeScale = d3.scale.linear()
      .domain([timeBegin, timeEnd])
      .range([0, width]);

    //timeline.selectAll("g").remove();

		cbars = timeline.append("g").selectAll(".cbar")
			.data(filteredClicks);

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

  }

  // -------------------------------------------------
  // draw main timeline axis
  // -------------------------------------------------
  function drawTimelineAxis(min, max) {
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

    draw(data, filteredClicks, images, minExtent, maxExtent);
   // //LINEAR SCALE for number of apps
   // var y = d3.scale.linear()
   //   .domain([0, laneLength])
   //   .range([0, laneLength * (barHeight + 2 * eBarPadding)]);

   // var x = d3.scale.linear()
   //   .domain([timeBegin, timeEnd])
   //   .range([m[3],w]);

   // //scale for brushed timeline
   // var xb = d3.scale.linear()
   //   .domain([minExtent, maxExtent])
   //   .range([0, w]);

   // //get new data based on brush extents
   // filteredApps = items.filter(function (el) {
   //   return (el.start <= maxExtent && el.start >= minExtent) ||
   //   (el.end <= maxExtent && el.end >= minExtent);
   // });
   // console.log(" ");
   // console.log("brush filtered: " + filteredApps.length);
   // console.log("timeBegin: " + timeBegin);
   // console.log("minExtentL " + Math.round(minExtent));
   // console.log("timeEnd: " + timeEnd);
   // console.log("maxExtent: " + Math.round(maxExtent));
   // console.log("-----");

   // eTimeline.selectAll(".ebarContainer").remove(); //remove ebars

   // var ebars = eTimeline.append("g")
   //   .attr("class","ebarContainer")
   //   .selectAll(".ebar")
   //   .data(filteredApps, function(d) {return d.id; });

   // //draw the actual expanded timeline bars
   // ebars.enter().append("rect")
   //   .attr("class","ebar")
   //   .attr("y", function(d) {return y(appTimesArray.findIndex(function(v){return v[0]==d.appid})) + eBarPadding;})
   //   .attr("x", function(d) {return xb(d.start);})
   //   .style("fill", function(d) {return timelineColors[appTimesArray.findIndex(function(v){return v[0]==d.appid}) % 12]})
   //   // .attr("width", function(d) {return x(timeBegin + d.end - d.start);}) //from original
   //   .attr("width", function(d) {return ( xb(d.end) - xb(d.start)); }) //x = value of scaled(end) - scaled(start)
   //   .attr("height", barHeight)
   //   .on("mouseover", function(d){ barMouseover(d); })
   //   .on("mousemove", function(d){ barMousemove(); })
   //   .on("mouseout", function(d){ barMouseout(); });

   // //ebars.exit().remove();
  }
  



  

















  // -------------------------------------------------
  // redraws expanded if brush is empty
  // -------------------------------------------------
  function brushEnd(){
    //if the brush is empty, redraw the timeline based on date
    if(brush.empty()){ renderTimeline();}
  }
});
