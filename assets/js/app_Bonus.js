function makeResponsive(){ 
  var svgArea = d3.select("body").select("svg");
  if (!svgArea.empty()) {
    svgArea.remove();
  }

  // SVG wrapper dimensions are determined by the current width
  // and height of the browser window.
  var svgWidth = window.innerWidth; 
  var svgHeight = window.innerHeight;

  var margin = { top: 50, right: 150, bottom: 150, left: 100};
  var height = svgHeight - margin.top - margin.bottom;
  var width  = svgWidth - margin.left - margin.right;

  var svg = d3.select("#scatter").append("svg").attr("width", svgWidth).attr("height", svgHeight);
  var chartGroup = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var XAxis1 = "poverty";
var YAxis1="healthcareLow";

// function used for updating x,y scales 
function xScale(data, XAxis1)  {
  var xLinearScale = d3.scaleLinear()
      .domain([ d3.min(data, d => d[XAxis1]) * 0.8,  d3.max(data, d => d[XAxis1]) * 1.2 ])
      .range([0, width]);
  return xLinearScale; }
function yScale(data, YAxis1) {
  var yLinearScale = d3.scaleLinear()
      .domain([ d3.min(data, d => d[YAxis1]) * 0.8, d3.max(data, d => d[YAxis1]) * 1.2 ])
      .range([height, 0]);
  return yLinearScale; }

// function used for updating xAxis, yAxis 
function xrenderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);
      xAxis.transition().duration(1000).call(bottomAxis);
  return xAxis; }
function yrenderAxes(newYScale, yAxis) {
  var leftAxis = d3.axisLeft(newYScale);
      yAxis.transition().duration(1000).call(leftAxis);
  return yAxis; }
    
function renderCircles(circlesGroup,  XAxis1, newXScale, YAxis1, newYScale) {
  circlesGroup.transition().duration(1000)
              .attr("cx", d => newXScale(d[XAxis1]))
              .attr("cy", d => newYScale(d[YAxis1]));
  return circlesGroup; }

//label the circles with the State symbols
function renderLabels(chartGroup, XAxis1,newXScale, YAxis1, newYScale) {  
  chartGroup.transition().duration(1000)
              .attr("x", d => newXScale(d[XAxis1]))
              .attr("y", d => newYScale(d[YAxis1]));
  return chartGroup; }


// function used for updating circles group with new tooltip
function updateToolTip(XAxis1, YAxis1, circlesGroup) {
    if (XAxis1 === "poverty")       {var xvars = "poverty:";}
    else if (XAxis1 === "age")      {var xvars = "age:"    ;}
    else                            {var xvars = "income:" ;}
    if (YAxis1 === "healthcareLow") { var yvars = "healthcareLow:";}
    else if (YAxis1 === "smokes")   { var yvars = "smokes:"       ;}
    else                            { var yvars = "obesity:"      ;}

    var toolTip = d3.tip().attr("class", "tooltip").offset([80, -60])
                    .style( "background", "rgba(0, 0, 0, 0.8)")
                    .style ("color", "#fff" )
                    .html(function(d) {
                      if (XAxis1 ==="poverty") {return (`${d.state} <br>${yvars} ${d[YAxis1]}% <br>${xvars} ${d[XAxis1]}%`)} 
                      else  {return (`${d.state} <br>${yvars} ${d[YAxis1]}% <br>${xvars} ${d[XAxis1]}`)}; 
                      }); 
    circlesGroup.call(toolTip);
    circlesGroup.on("mouseover", function(data) {toolTip.show(data, this); })
                .on("mouseout", function(data) {toolTip.hide(data);  } );
return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("./assets/data/data.csv") .then(function(data) {
  // if (err) throw err;
    data.forEach(function(data) {
      data.poverty = +data.poverty;
      data.healthcareLow = +data.healthcareLow;
      data.smokes = +data.smokes;
      data.abbr = data.abbr;
      data.age = +data.age;});
 
    // xLinearScale function above csv import
    var xLinearScale = xScale(data, XAxis1);
    var yLinearScale = yScale(data, YAxis1);

    // Create initial axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis   = d3.axisLeft(yLinearScale);

    // append x axis
    var xAxis = chartGroup.append("g").classed("x-axis", true).attr("transform", `translate(0, ${height})`).call(bottomAxis);
    var yAxis = chartGroup.append("g").classed("y-axis", true).call(leftAxis);

    // append initial circles
    var circlesGroup = chartGroup.selectAll("circle").data(data).enter().append("circle")
                                  .attr("cx", d => xLinearScale(d[XAxis1]))
                                  .attr("cy", d => yLinearScale(d[YAxis1]))
                                  .attr("r", 15).attr("fill", "pink").attr("opacity", ".5");

    // append the initial labels to the circles
    var chartGroup1 = chartGroup.selectAll('.circletext').data(data).enter().append("text").classed('circletext',true)
                                  .attr("x", d => xLinearScale(d[XAxis1]))
                                  .attr("y", d => yLinearScale(d[YAxis1]))
                                  .style("text-anchor", "middle")
                                  .style("pointer-events", "none")
                                  .text(d=> d.abbr); 
           
    // Create group for  3 x-axes titles
    var xlabelsGroup = chartGroup.append("g").attr("transform", `translate(${width / 2}, ${height +20})`)
    var xLabel1 = xlabelsGroup.append("text").attr("x", 0).attr("y", 20)
                        .attr("value", "poverty") .classed("active", true).text("in Poverty (%)");
    var xLabel2 = xlabelsGroup.append("text").attr("x", 0).attr("y", 40)
                        .attr("value", "age") .classed("inactive", true).text("age(Median)");
    var xLabel3 = xlabelsGroup.append("text").attr("x", 0).attr("y", 60)
                        .attr("value", "income") .classed("inactive", true).text("Househole Income (Median)");
                                      
                  
    // Create group for  y x-axes titles  
    var ylabelsGroup = chartGroup.append("g")
    var yLabel1 = ylabelsGroup.append("text").attr("y", -30).attr("x", 0 - (height / 2))
                        .attr("value", "healthcareLow") .attr("transform", "rotate(-90)")  
                        .classed("active", true).text("Lacks in Healthcare (%)");
    var yLabel2 = ylabelsGroup.append("text").attr("y", -50).attr("x", 0 - (height / 2))
                        .attr("value", "smokes").attr("transform", "rotate(-90)")  
                        .classed("inactive", true).text("Smokes (%)");
    var yLabel3 = ylabelsGroup.append("text").attr("y", -70).attr("x", 0 - (height / 2))
                        .attr("value", "obesity").attr("transform", "rotate(-90)")  
                        .classed("inactive", true).text("Obese (%)");
                    

  // updateToolTip function above csv import
  var circlesGroup = updateToolTip(XAxis1,YAxis1, circlesGroup);
  chartGroup1 

  // x axis labels event listener
  xlabelsGroup.selectAll("text")
    .on("click", function() {
      var value = d3.select(this).attr("value");
      if (value !== XAxis1) {
        XAxis1 = value;
        xLinearScale = xScale(data, XAxis1);
        xAxis = xrenderAxes(xLinearScale, xAxis);
        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup,  XAxis1, xLinearScale, YAxis1, yLinearScale);
        chartGroup1 = renderLabels(chartGroup1, XAxis1,xLinearScale, YAxis1, yLinearScale) ;
        chartGroup1;
        // updates tooltips with new info
        circlesGroup = updateToolTip(XAxis1, YAxis1, circlesGroup);

        // changes classes to change bold text
        if (XAxis1 === "poverty") {
            xLabel1.classed("active", true).classed("inactive", false);
            xLabel2.classed("active", false).classed("inactive", true);
            xLabel3.classed("active", false).classed("inactive", true);
            }
        else if (XAxis1 === "age"){  
            xLabel1.classed("active", false).classed("inactive", true);
            xLabel2.classed("active", true).classed("inactive", false);
            xLabel3.classed("active", false).classed("inactive", true);
            }
        else {  
            xLabel1.classed("active", false).classed("inactive", true);
            xLabel2.classed("active", false).classed("inactive", true);
            xLabel3.classed("active", true).classed("inactive", false);
            }
        }
    });

  ylabelsGroup.selectAll("text")
    .on("click", function() {
      var value = d3.select(this).attr("value");
      if (value !== YAxis1) {
        YAxis1 = value;
        yLinearScale = yScale(data, YAxis1);
        yAxis = yrenderAxes(yLinearScale, yAxis);
        // updates circles with new y values
        circlesGroup =  renderCircles(circlesGroup,  XAxis1, xLinearScale, YAxis1, yLinearScale);
        chartGroup1 = renderLabels(chartGroup1, XAxis1,xLinearScale, YAxis1, yLinearScale) ;
        chartGroup1;

        // updates tooltips with new info
        circlesGroup = updateToolTip(XAxis1, YAxis1, circlesGroup);
        // changes classes to change bold text
        if (YAxis1 === "healthcareLow") {
            yLabel1.classed("active", true).classed("inactive", false);
            yLabel2.classed("active", false).classed("inactive", true);
            yLabel3.classed("active", false).classed("inactive", true);
            }
        else if (YAxis1 === "smokes"){  
            yLabel1.classed("active", false).classed("inactive", true);
            yLabel2.classed("active", true).classed("inactive", false);
            yLabel3.classed("active", false).classed("inactive", true);
            }
        else {  
            yLabel1.classed("active", false).classed("inactive", true);
            yLabel2.classed("active", false).classed("inactive", true);
            yLabel3.classed("active", true).classed("inactive", false);
            }
       }
    });
});

}


makeResponsive();
d3.select(window).on("resize", makeResponsive);

