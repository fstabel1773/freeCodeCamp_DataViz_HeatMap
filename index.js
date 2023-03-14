import * as d3 from "https://unpkg.com/d3?module";

const url =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

fetch(url)
  .then((res) => {
    if (!res.ok) {
      throw new Error(response.statusText);
    }
    return res.json();
  })
  .then((data) => {
    // data mapping
    const baseTemp = data.baseTemperature;
    const dataset = data.monthlyVariance.map((d) => {
      d.monthDate = d3.timeParse("%m")(d.month);
      d.temperature = d.variance + baseTemp;
      return d;
    });

    const minYear = d3.min(dataset, (d) => d3.timeParse("%Y")(d.year));
    const maxYear = d3.max(dataset, (d) => d3.timeParse("%Y")(d.year));
    const minTemp = d3.min(dataset, (d) => d.temperature);
    const maxTemp = d3.max(dataset, (d) => d.temperature);

    const legendTickValues = getLegendTickValues(11);
    function getLegendTickValues(count) {
      const step = (maxTemp - minTemp) / count;
      let value = minTemp;
      const valueArray = [];
      while (value < maxTemp) {
        valueArray.push(value);
        value += step;
      }
      return valueArray;
    }

    // text
    const title = `Monthly Global Land-Surface Temperature`;
    const description = `${minYear.getFullYear()} - ${maxYear.getFullYear()}: base temperature ${baseTemp}℃`;
    const yAxisLabel = `Months`;
    const xAxisLabel = `Years`;

    // color-scale
    const colorScale = d3
      .scaleSequential()
      .domain(d3.extent(dataset, (d) => d.temperature).reverse())
      .interpolator(d3.interpolateRdYlBu);

    // layout variables
    const width = 1400;
    const height = 540;
    const xPadding = 100;
    const yPadding = 30;

    const legendWidth = width / 2.5;
    const legendSquare =
      (legendWidth - xPadding) / (legendTickValues.length - 1);
    const legendHeight = 2 * legendSquare;

    // container
    const container = d3
      .select("body")
      .append("div")
      .attr("class", "container");

    // title and description
    const header = container.append("div").attr("class", "header");
    header.append("h1").text(title).attr("id", "title").attr("x", xPadding);
    header.append("h4").text(description).attr("id", "description");

    // svg
    const svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height + yPadding);

    // tooltip
    const tooltip = d3
      .select("body")
      .append("g")
      .attr("id", "tooltip")
      .style("opacity", 0);

    const mouseenter = (event, d) => {
      tooltip.style("opacity", 0.9);
    };

    const mouseleave = (event, d) => {
      tooltip.transition().duration(500).style("opacity", 0);
    };

    const mousemove = (event, d) => {
      const [a, b] = d3.pointer(event);

      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(
          `<p>${d.year} - ${d.monthDate.toLocaleString("en-US", {
            month: "long",
          })}</p>
     <p>${d.temperature.toFixed(1)}°C</p>
     <p>${d.variance}°C</p>`
        )
        .attr("data-year", d.year)
        .style("left", a + 25 + "px")
        .style("top", b + "px");
    };

    // scales and axes
    const xScale = d3
      .scaleTime()
      .domain([minYear, maxYear])
      .range([xPadding, width - xPadding]);
    const yScale = d3
      .scaleBand()
      .domain(
        [
          ...new Set(
            dataset.map((d) => {
              return d.monthDate.toLocaleString("en-US", { month: "long" });
            })
          ),
        ].reverse()
      )
      .range([height - yPadding, yPadding]);

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.floor([...new Set(dataset.map((d) => d.year))].length / 10));
    const yAxis = d3.axisLeft(yScale).tickSize(15);

    svg
      .append("g")
      .attr("transform", `translate(0, ${height - yPadding})`)
      .attr("id", "x-axis")
      .call(xAxis);

    svg
      .append("g")
      .attr("transform", `translate(${xPadding}, 0)`)
      .attr("id", "y-axis")
      .call(yAxis);

    // axis-label
    svg
      .append("text")
      .attr("class", "axisLabel")
      .attr("text-anchor", "end")
      .attr("x", width - 2 * xPadding)
      .attr("y", height + 10)
      .text(xAxisLabel);

    svg
      .append("text")
      .attr("class", "axisLabel")
      .attr("text-anchor", "end")
      .attr("x", -2 * yPadding)
      .attr("y", yPadding)
      .attr("transform", "rotate(-90)")

      .text(yAxisLabel);

    // cells
    const cell = svg
      .selectAll("rect")
      .data(dataset)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("data-month", (d) => d.month - 1)
      .attr("data-year", (d) => d.year)
      .attr("data-temp", (d) => d.temperature)
      .attr("x", (d, i) => xScale(d3.timeParse("%Y")(d.year)))
      .attr("y", (d, i) => {
        return yScale(d.monthDate.toLocaleString("en-US", { month: "long" }));
      })
      .attr("width", (width - 2 * xPadding) / (dataset.length / 12))
      .attr("height", (height - 2 * yPadding) / 12)
      .style("fill", (d) => colorScale(d.temperature))
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
      .on("mouseenter", mouseenter);

    // legend
    const legend = container
      .append("svg")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("id", "legend");

    const legendXScale = d3
      .scaleLinear()
      .domain(d3.extent(legendTickValues))
      .range([xPadding, legendWidth]);

    const legendXAxis = d3
      .axisBottom(legendXScale)
      .tickValues(legendTickValues.slice(1, legendTickValues.length - 1))
      .tickFormat(d3.format(",.1f"));

    legend
      .append("g")
      .attr("transform", `translate(0, ${legendSquare})`)
      .attr("id", "legend-x-axis")
      .call(legendXAxis);

    // nb: color takes value between to ticks
    legend
      .selectAll("rect")
      .data(legendTickValues.slice(1, legendTickValues.length - 2))
      .enter()
      .append("rect")
      .attr("x", (d, i) => legendXScale(d))
      .attr("y", 0)
      .attr("width", (d, i) => legendSquare)
      .attr("height", (d, i) => legendSquare)
      .attr("fill", (d, i) => colorScale(d + (legendTickValues[i + 2] - d) / 2))
      .attr("stroke", "black");
  })
  .catch((error) =>
    console.log("Not able to fetch the data. There was an error: ", error)
  );
