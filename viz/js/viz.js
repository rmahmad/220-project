$(document).ready(function() {
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
  width = 1800,
  height = 600;

  var x = d3.scale.linear()
    .domain([0,3600])
    .range([0, 1800]);

  var y = d3.scale.linear()
    .domain([0,1200])
    .range([600, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

  var max = {x: 1800, y: 600}
  var imgUrl = "../assets/PICTURE.jpg";

  var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  svg.append("defs")
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

  svg.append("rect")
      .attr("x", "40")
      .attr("y", "20")
      .attr("width", max.x)
      .attr("height", max.y)
      .attr("fill", "url(#image)");

  svg = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
    svg.selectAll(".dot").remove();

    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        return "<strong>App:</strong> <span style='color:red'>" + data['apps'][d.app_id-1]['name'] + "</span>";
      })
    svg.call(tip)

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

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .append("text")
      .attr("class", "label")
      .attr("x", width)
      .attr("y", -6);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em");

    svg.selectAll(".dot")
      .data(filteredClicks)
      .enter().append("svg:circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return x(d.x); })
      .attr("cy", function(d) { return y(d.y); })
      .attr("blahx", function(d) {return d.x})
      .attr("blahy", function(d) {return d.y})
      .attr("blahapp", function(d) {return data['apps'][d.app_id]['name']})
      .attr("blahappid", function(d) {return d.app_id})
      .attr("blahtime", function(d) {return d.time})
      .style("fill", function(d) { return color(d.app_id); })
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);
  }
});
