const guides = [
    {
        "name": "출발지",
        "x": 126.7094887015742,
        "y": 34.92633040190111,
        "distance": 0,
        "duration": 0,
        "type": 100,
        "guidance": "출발지",
        "road_index": 0
    },
    {
        "name": "",
        "x": 126.70775154883144,
        "y": 34.926834749848155,
        "distance": 206,
        "duration": 46,
        "type": 2,
        "guidance": "우회전",
        "road_index": 1
    },
    {
        "name": "",
        "x": 126.70850984664662,
        "y": 34.928032660069405,
        "distance": 150,
        "duration": 14,
        "type": 2,
        "guidance": "우회전",
        "road_index": 2
    },
    {
        "name": "",
        "x": 126.71089475966491,
        "y": 34.93299765653535,
        "distance": 660,
        "duration": 138,
        "type": 1,
        "guidance": "좌회전",
        "road_index": 3
    },
    {
        "name": "덕진초교사거리",
        "x": 126.69665877444879,
        "y": 34.82117969087082,
        "distance": 13206,
        "duration": 792,
        "type": 2,
        "guidance": "독천리 목포 방면으로 우회전",
        "road_index": 4
    },
    {
        "name": "",
        "x": 126.68548696585043,
        "y": 34.79507174356494,
        "distance": 3309,
        "duration": 311,
        "type": 71,
        "guidance": "목포 방면으로 회전교차로에서 오른쪽 2시 방향",
        "road_index": 5
    },
    {
        "name": "학산교차로",
        "x": 126.57953275112816,
        "y": 34.72076809820744,
        "distance": 14044,
        "duration": 673,
        "type": 6,
        "guidance": "대불산단 목포 방면으로 오른쪽 방향",
        "road_index": 6
    },
    {
        "name": "호등교차로",
        "x": 126.47915581636606,
        "y": 34.746066306671004,
        "distance": 10314,
        "duration": 620,
        "type": 1,
        "guidance": "화원 방면으로 좌회전",
        "road_index": 7
    },
    {
        "name": "대불교차로",
        "x": 126.45047407019976,
        "y": 34.74399207262905,
        "distance": 2829,
        "duration": 216,
        "type": 2,
        "guidance": "대불산단 방면으로 우회전",
        "road_index": 8
    },
    {
        "name": "",
        "x": 126.44325973685855,
        "y": 34.75659160226267,
        "distance": 1555,
        "duration": 138,
        "type": 1,
        "guidance": "좌회전",
        "road_index": 9
    },
    {
        "name": "",
        "x": 126.43732947000959,
        "y": 34.75426216767087,
        "distance": 602,
        "duration": 69,
        "type": 1,
        "guidance": "좌회전",
        "road_index": 10
    },
    {
        "name": "목적지",
        "x": 126.43853611593227,
        "y": 34.75224051384855,
        "distance": 250,
        "duration": 62,
        "type": 101,
        "guidance": "목적지",
        "road_index": -1
    }
];

for (const guide of guides) {
    console.log(`[${guide.y}, ${guide.x}],`)
}