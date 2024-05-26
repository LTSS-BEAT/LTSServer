Dropzone.autoDiscover = false;

const uploadForm = new Dropzone("#uploadForm", {
    maxFiles: 1,
    acceptedFiles: '.xlsx',
    dictDefaultMessage: '일정 생성을 위한 운송 목록을 올려주세요',
    paramName: 'file', // The name that will be used to transfer the file

    init: function() {
        this.on("success", function(file, response) {
            // Make a GET request to fetch the uploaded file's data
            fetch('/lists')
                .then(response => response.json())
                .then(data => {
                    const resultContainer = document.getElementById("uploadResult");
                    let html = '<table class="table table-bordered"><thead><tr><th>출발지</th><th>주소</th><th>도착지</th><th>주소</th><th>최소 출발 시간</th><th>최대 출발 시간</th><th>최소 도착 시간</th><th>최대 도착 시간</th></tr></thead><tbody>';
                    data.list.forEach((row, index) => {
                        html += `<tr data-id="${row.tid}">
                                    <td>${row['dep_name']}</td>
                                    <td id="dep_address-${index}">`;
                        if (row['dep_address']) {
                            html += row['dep_address'];
                        } else {
                            html += `<select class="dep-dropdown" data-index="${index}">
                                        <option value="">Select location</option>
                                    </select>`;
                        }
                        html += `</td>
                                    <td>${row['dest_name']}</td>
                                    <td id="dest_address-${index}">`;
                        if (row['dest_address']) {
                            html += row['dest_address'];
                        } else {
                            html += `<select class="dest-dropdown" data-index="${index}">
                                        <option value="">Select location</option>
                                    </select>`;
                        }
                        html += `</td>
                                    <td>
                                        <input type="time" class="dep_time_min" data-index="${index}" value="${row['dep_time_min'] ? new Date(row['dep_time_min']).toISOString().substring(11, 5) : ''}">
                                    </td>
                                    <td>
                                        <input type="time" class="dep_time_max" data-index="${index}" value="${row['dep_time_max'] ? new Date(row['dep_time_max']).toISOString().substring(11, 5) : ''}">
                                    </td>
                                    <td>
                                        <input type="time" class="dest_time_min" data-index="${index}" value="${row['dest_time_min'] ? new Date(row['dest_time_min']).toISOString().substring(11, 5) : ''}">
                                    </td>
                                    <td>
                                        <input type="time" class="dest_time_min" data-index="${index}" value="${row['dest_time_max'] ? new Date(row['dest_time_max']).toISOString().substring(11, 5) : ''}">
                                    </td>
                                </tr>`;
                    });

                    html += '</tbody></table>';
                    resultContainer.innerHTML = html;
    
                    // Fetch possible locations and addresses separately and populate dropdowns
                    data.list.forEach((row, index) => {
                        const departure = row['dep_name'];
                        const destination = row['dest_name'];
    
                        // Fetch possible locations for departure
                        fetch(`/search/internal?keyword=${departure}`)
                            .then(res => res.json())
                            .then(searchData => {
                                const dropdown = document.querySelector(`#dep_address-${index} .dep-dropdown`)
                                if (searchData.length > 0) {
                                    searchData.forEach(location => {
                                        const option = document.createElement('option');
                                        option.value = JSON.stringify({
                                            address: location.address,
                                            latitude: location.lat,
                                            longitude: location.lon
                                        });
                                        option.textContent = location;
                                        dropdown.appendChild(option);
                                    })
                                } else {
                                    fetch(`/search/external?keyword=${departure}`)
                                        .then(res => res.json())
                                        .then(searchData => {
                                            searchData.data.forEach(location => {
                                                const option = document.createElement('option');
                                                option.value = JSON.stringify({
                                                    address: location.address,
                                                    latitude: location.lat,
                                                    longitude: location.lon
                                                });
                                                option.textContent = location.address;
                                                dropdown.appendChild(option);
                                            });
                                        })
                                        .catch(error => {
                                            console.error(`Error fetching locations for ${departure} from externalSearch:`, error);
                                        });
                                }
                            })
                            .catch(error => {
                                console.error(`Error fetching locations for ${departure} from internalSearch:`, error);
                            })
    
                        // Fetch possible locations for departure
                        fetch(`/search/internal?keyword=${destination}`)
                            .then(res => res.json())
                            .then(searchData => {
                                const dropdown = document.querySelector(`#dest_address-${index} .dest-dropdown`)
                                if (searchData.length > 0) {
                                    searchData.forEach(location => {
                                        const option = document.createElement('option');
                                        option.value = JSON.stringify({
                                            address: location.address,
                                            latitude: location.lat,
                                            longitude: location.lon
                                        });
                                        option.textContent = location;
                                        dropdown.appendChild(option);
                                    })
                                } else {
                                    fetch(`/search/external?keyword=${destination}`)
                                        .then(res => res.json())
                                        .then(searchData => {
                                            searchData.data.forEach(location => {
                                                const option = document.createElement('option');
                                                option.value = JSON.stringify({
                                                    address: location.address,
                                                    latitude: location.lat,
                                                    longitude: location.lon
                                                });
                                                option.textContent = location.address;
                                                dropdown.appendChild(option);
                                            });
                                        })
                                        .catch(error => {
                                            console.error(`Error fetching locations for ${destination} from externalSearch:`, error);
                                        });
                                }
                            })
                            .catch(error => {
                                console.error(`Error fetching locations for ${destination} from internalSearch:`, error);
                            })
                    })
                })
                .catch(error => {
                    document.getElementById("uploadResult").innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
                });
        });
    }
});
