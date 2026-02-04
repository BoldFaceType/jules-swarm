module.exports = function (jsModule) {
    switch (jsModule) {
        case 'drivelist': return require('C:/Users/genie.theia/jenkins_agent/workspace/theia-ide-release/node_modules/drivelist/build/Release/drivelist.node');
    }
    throw new Error(`unhandled module: "${jsModule}"`);
}