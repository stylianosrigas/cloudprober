// Copyright 2022 The Cloudprober Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var baseData = {
  data: {
    x: 'ts',
    xFormat: '%Y/%m/%d %H:%M',
    columns: [],
  },
  axis: {
    x: {
      type: 'timeseries',
      tick: {
        format: '%Y-%m-%d %H:%M',
      },
    },
  },
  point: {
    show: true,
    r: 2,
  },
};

function populateProbeData() {
  let gd = psd[probe];

  d[probe] = structuredClone(baseData);
  d[probe].bindto = '#chart_' + probe;

  // Timestamps
  let x = ['ts'];

  // Construct x-axis using startTime and endTime.
  for (let s = gd.StartTime; s < gd.EndTime; s = s + gd.ResSeconds) {
    dt = new Date(s * 1000);
    m = dt.getMonth() + 1;
    dtStr =
      dt.getFullYear() +
      '/' +
      m +
      '/' +
      dt.getDate() +
      ' ' +
      dt.getHours() +
      ':' +
      dt.getMinutes();
    x.push(dtStr);
  }
  d[probe].data.columns.push(x);
  if (x.length > 500) {
    d[probe].point.r = 1;
  }

  // Data colums
  for (tgt in gd.Values) {
    let vals = gd.Values[tgt];
    let freqs = gd.Freqs[tgt];
    let c = [tgt];
    for (var i = 0; i < vals.length; i++) {
      let val = vals[i];
      if (val == -1) {
        val = null;
      }
      c.push(...Array(freqs[i]).fill(val));
    }
    d[probe].data.columns.push(c);
  }
}

function populateD() {
  for (probe in psd) {
    populateProbeData(probe);
  }
}

function dateToValStr(dt) {
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
}

function setupGraphEndpoint() {
  // Set up change handler.
  $('#graph-endtime').change(function () {
    var v = $(this).val();
    var params = new URLSearchParams(location.search);
    if (v != '') {
      var d = new Date($(this).val());
      var t = d.getTime() / 1000;
      params.set('graph_endtime', t);
    } else {
      params.delete('graph_endtime');
    }
    window.location.search = params.toString();
  });

  var params = new URLSearchParams(location.search);
  if (typeof startTime != undefined) {
    $('#graph-endtime').attr('min', dateToValStr(new Date(startTime)));
  }
  if (params.get('graph_endtime')) {
    let dt = new Date(params.get('graph_endtime') * 1000);
    if (dt) {
      $('#graph-endtime').val(dateToValStr(dt));
    }
  }
}

function setupGraphDuration() {
  $('#graph-duration').change(function () {
    var v = $(this).val();
    var params = new URLSearchParams(location.search);
    if (v != '') {
      params.set('graph_duration', $(this).val());
    } else {
      params.delete('graph_duration');
    }
    window.location.search = params.toString();
  });

  var params = new URLSearchParams(location.search);
  if (params.get('graph_duration')) {
    $('#graph-duration').val(params.get('graph_duration'));
  }
}

// selectedProbes returns the selected probes in a map (object) to allow for
// quick lookups and easy modification.
function selectedProbes() {
  var params = new URLSearchParams(window.location.search);
  let currentProbes = params.getAll('probe');
  var probeMap = {};
  for (let i = 0; i < currentProbes.length; i++) {
    probeMap[currentProbes[i]] = true;
  }
  return probeMap;
}

// Update probe query parameter to the provided list.
function updateProbeParams(probes) {
  var params = new URLSearchParams(window.location.search);
  params.delete('probe');
  for (const probe of probes) {
    params.append('probe', probe);
  }
  window.location.search = params.toString();
}

function handleProbeSelect(e) {
  let probe = e.target.id.replace(/^select-/, '');
  if (probe == 'all') {
    updateProbeParams([]);
    return;
  }

  var probeMap = selectedProbes();
  if (e.target.checked) {
    probeMap[probe] = true;
  } else {
    delete probeMap[probe];
  }
  updateProbeParams(Object.keys(probeMap));
}

function geenrateProbeSelectors() {
  var probeMap = selectedProbes();

  var allChecked = Object.keys(probeMap).length === 0 ? 'checked ' : ' ';
  var selectors = `Probes: <label><input class=probe-checkbox id=select-all type=checkbox ${allChecked}>All</label> `;

  for (let i = 0; i < allProbes.length; i++) {
    let p = allProbes[i];
    let checked = probeMap[p] ? 'checked ' : ' ';
    selectors += `<label> | <input class=probe-checkbox id=select-${p} type=checkbox ${checked}>${p}</label>`;
  }

  $('#probe-selector').append(selectors);

  $('.probe-checkbox').change(handleProbeSelect);
}

$(document).ready(function () {
  setupGraphEndpoint();
  setupGraphDuration();
  geenrateProbeSelectors();

  $('#show-hide-debug-info').click(function () {
    $('#debug-info').toggle();
  });
});
