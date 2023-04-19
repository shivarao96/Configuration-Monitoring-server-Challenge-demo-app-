const parseSystemConfigData = function(referenceObj) {
    let currentSection = '';
    var simulcrypt = '';
    return function(line) {
        if (line.startsWith('[')) {
            currentSection = line.substring(1, line.length - 1);
            if (!referenceObj[currentSection]) {
                referenceObj[currentSection] = [];
            }
          } else if (currentSection === 'ECMG') {
            const match = line.match(/^(\d+):\s*(\S+):\s*(\d+):\s*(.*)$/);
            if (match) {
              const instanceId = match[1];
              const ip = match[2];
              const port = match[3];
              const ipList = match[4].split(',').map(str => str.trim());
              referenceObj[currentSection].push({ instance_id: instanceId, ip: ip, port: port, ip_list: ipList });
            }
          } else if (currentSection === 'SIMULCRYPT') {
              if (line.startsWith('##')) {
                  simulcrypt += line.substring(2, line.length)
              } else if(line.startsWith('#')) {
                const [settingKey, settingVal] = (line.substring(1, line.length)).split(":");
                referenceObj[currentSection].push({[settingKey]: settingVal.trim(), description: simulcrypt.trim()});
                simulcrypt = '';
              }
          }
    }
}

const parseUserData = function(referenceObj) {
    let currentGroup;
    return function (line) {
        if (line.startsWith('##')) {
            currentGroup = {
              group_id: line.split(":")[0].substring(line.indexOf('##') + 2).toLowerCase().trim(),
              group_name: line.substring(line.indexOf(':') + 2).toLowerCase(),
              services: []
            };
            referenceObj.push(currentGroup);
          } else if (line.indexOf(':') !== -1) {
            const [serviceId, productsString] = line.split(':');
            const products = productsString.trim().split(',').map(product => {
              return { product_id: product.trim() };
            });
        
            currentGroup.services.push({
              service_id: serviceId.trim(),
              products
            });
          }
    }
}

module.exports = {
    parseSystemConfigData: parseSystemConfigData,
    parseUserData: parseUserData
};