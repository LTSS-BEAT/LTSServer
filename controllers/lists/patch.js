const db = require('../../db');

function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours * 60) + minutes;
}

function timeToMinutesDestination(timeStringDep, timeStringDest) {
    const [hoursDep, minutesDep] = timeStringDep.split(':').map(Number);
    const departureTime = (hoursDep * 60) + minutesDep
    const [hoursDest, minutesDest] = timeStringDest.split(':').map(Number);
    const destinationTime = (hoursDest * 60) + minutesDest;
    return (departureTime > destinationTime) ? destinationTime + 1440 : destinationTime;
}

module.exports = (req, res, next) => {
    const queryData = req.body;

    // Prepare an array to hold promises for each database query
    const updatePromises = queryData.map(data => {
        const query = `
            UPDATE task 
            SET 
                base_date = ?,
                dep_address = ?, 
                dest_address = ?, 
                dep_time_min = ?, 
                dep_time_max = ?, 
                dest_time_min = ?, 
                dest_time_max = ?, 
                dep_lat = ?, 
                dep_lon = ?, 
                dest_lat = ?, 
                dest_lon = ? 
            WHERE 
                tid = ?`;

        const values = [
            data.selectedDate,
            data.dep_address, 
            data.dest_address, 
            timeToMinutes(data.dep_time_min), 
            timeToMinutes(data.dep_time_max), 
            timeToMinutesDestination(data.dep_time_min, data.dest_time_min), 
            timeToMinutesDestination(data.dep_time_max, data.dest_time_max), 
            data.dep_lat, 
            data.dep_lon, 
            data.dest_lat, 
            data.dest_lon, 
            data.target
        ];

        return new Promise((resolve, reject) => {
            db.query(query, values, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    });

    // Use Promise.all to wait for all queries to complete
    Promise.all(updatePromises)
        .then(results => {
            res.json({ message: 'Updated successfully', results });
        })
};