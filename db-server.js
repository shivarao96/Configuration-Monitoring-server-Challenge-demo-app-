function getAllProducts(pool, apiResponseHandler) {
  if (pool) {
    try {
      pool.query('SELECT * FROM "Product"', (err, res) => {
        if (err) {
          apiResponseHandler.status(400).send({
            message: "error",
            data: res,
            error: err
          });
        } else {
          apiResponseHandler.status(200).send({
            message: "success",
            data: res.rows
          });
        }
      });
    } catch (e) {
      apiResponseHandler.status(400).send({
        message: "error",
        error: e
      });
    }
  } else {
    apiResponseHandler.status(400).send({
      message: "error !, unable to access the DB server",
    });
  }
}

function getAllServices(pool, apiResponseHandler) {
  if (pool) {
    try {
      pool.query('SELECT * FROM "Service"', (err, res) => {
        if (err) {
          apiResponseHandler.status(400).send({
            message: "error",
            data: res,
            error: err
          });
        } else {
          apiResponseHandler.status(200).send({
            message: "success",
            data: res.rows
          });
        }
      });
    } catch (e) {
      apiResponseHandler.status(400).send({
        message: "error",
        error: e
      });
    }
  } else {
    apiResponseHandler.status(400).send({
      message: "error",
      error: 'Failed to access the the DB !'
    });
  }
}

function getAllGroups(pool, apiResponseHandler) {
  if (pool) {
    try {
      pool.query('SELECT * FROM "Group"', (err, res) => {
        if (err) {
          apiResponseHandler.status(400).send({
            message: "error",
            data: res,
            error: err
          });
        } else {
          apiResponseHandler.status(200).send({
            message: "success",
            data: res.rows
          });
        }
      });
    } catch (e) {
      apiResponseHandler.status(400).send({
        message: "error",
        error: e
      });
    }
  } else {
    apiResponseHandler.status(400).send({
      message: "error !, unable to access the DB server",
    });
  }
}

function insertBulkDataIntoTableQuery(table, propsObj = [], propsValue = []) {
  if (propsObj.length === 0 || propsValue.length === 0) {
    return null;
  } else {
    const columns = `(${propsObj.map((prop) => `"${prop}"`).join(',')})`;
    let rowsArr = [];
    for (let i = 0; i < propsValue.length; i++) {
      rowsArr.push(propsValue[i]);
    }
    const rows = rowsArr.join(',');

    return `INSERT INTO "${table}" ${columns} VALUES ${rows};`;
  }
}

function addServiceMetaInfo(pool, apiResponseHandler, group_id, service_id, product_id) {
  if (pool) {
    pool.query(`
    SELECT * FROM "Service_Meta_Data" WHERE "group_id" = '${group_id}' AND "service_id" = '${service_id}' AND "product_id" = '${product_id}';
  `, (err, res) => {
    if (err) {
      apiResponseHandler.status(400).send({
        message: "error!",
        error: err
      });
    } else {
      if (res.rows.length) {
        apiResponseHandler.send({
          message: 'error',
          error: 'value already exist !, Duplicate service meta not allowed'
        });
      } else {
        pool.query(`
        INSERT INTO "Service_Meta_Data" ("group_id", "service_id", "product_id") VALUES ('${group_id}', '${service_id}', '${product_id}')
        `, (err, res) => {
          if (err) {
            apiResponseHandler.status(400).send({
              message: "error",
              data: res,
              error: err
            });
          } else {
            apiResponseHandler.send({
              message: 'success',
              data: res.rows
            })
          }
        });
      }

    }
  });
  } else {
    apiResponseHandler.status(400).send({
      message: "error !, unable to access the DB server",
    });
  }
}

function updateServiceMetaInfo(pool, apiResponseHandler, group_id, prev_service_id, prev_product_id, service_id, product_id) {
  if (pool) {
    pool.query(`
    SELECT * FROM "Service_Meta_Data" WHERE "group_id" = '${group_id}' AND "service_id" = '${service_id}' AND "product_id" = '${product_id}';
  `, (err, res) => {
    if (err) {
      apiResponseHandler.status(400).send({
        message: "error",
        data: res,
        error: err
      });
    } else {
      if (res.rows.length) {
        apiResponseHandler.status(400).send({
          message: 'value already exist !, Duplicate service meta not allowed',
          data: res,
          error: err
        });
      } else {
        const setQuery = [];
        let whereCondition = '';

        if (group_id) {
          whereCondition = `"group_id" = '${group_id}' and "service_id" = '${prev_service_id}' and "product_id" = '${prev_product_id}'`;
        }
        if (service_id) {
          setQuery.push(`"service_id" = '${service_id}'`)
        }
        if (product_id) {
          setQuery.push(`"product_id" = '${product_id}'`)
        }

        pool.query(`
        UPDATE "Service_Meta_Data"
        SET ${setQuery.join(", ")}
        WHERE ${whereCondition};
        `, (err, res) => {
          if (err) {
            apiResponseHandler.status(400).send({
              message: "Failed to add new data ",
              data: res,
              error: err
            });
          } else {
            apiResponseHandler.status(200).send({
              message: "success",
              data: res.rows
            });
          }
        });
      }
    }
  });
  } else {
    apiResponseHandler.status(400).send({
      message: "error !, unable to access the DB server",
    });
  }
}

function getAllServiceMetaInfo(pool, apiResponseHandler, limit = 10, offset = 0, group_id=null, service_id = null, product_id = null) {
  if (pool) {
    let whereCondition = 'WHERE ';
    if (group_id) {
      whereCondition += `"Group"."group_id" = '${group_id}'`
    } else if (service_id) {
      whereCondition += `"Service"."service_id" = '${service_id}'`
    } else if (product_id) {
      whereCondition += `"Product"."product_id" = '${product_id}'`
    } else {
      whereCondition = '';
    }
    pool.query(`
      SELECT "Group"."group_id", "Group"."group_name", "Group"."description" AS Group_description, 
          "Service"."service_id","Service"."service_name","Service"."description" AS service_description, 
          "Product"."product_id","Product"."product_name", "Product"."description" AS Product_Description,
          COUNT(*) OVER () AS count
      FROM "Service_Meta_Data"
      JOIN "Group" ON "Service_Meta_Data"."group_id" = "Group"."group_id"
      JOIN "Service" ON "Service_Meta_Data"."service_id" = "Service"."service_id"
      JOIN "Product" ON "Service_Meta_Data"."product_id" = "Product"."product_id" ${whereCondition}
      GROUP BY "Group"."group_id", "Service"."service_id", "Product"."product_id"
      ORDER BY "Group"."group_id", "Service"."service_id", "Product"."product_id"
      LIMIT ${limit}
      OFFSET ${offset};
    `, (err, res) => {
      let status = 200;
      let responseObj = {};
      if(err) {
        status = 400;
          responseObj = {
            message: "error",
            error: err,
            check: 1
          };
      } else {
        if (res.rows && res.rows.length) {
          console.log(res.rows);
          const output = res.rows.reduce((groups, item) => {
            const { group_id, group_name, group_description, service_id, service_name, service_description, product_id, product_name, product_description } = item;
            const service = { service_id, service_name, service_description, products: [{ product_id, product_description, product_name }] };
            const group = { group_id, group_name, group_description, services: [service] };
            const existingGroup = groups.find(g => g.group_id === group_id);
            if (existingGroup) {
              const existingService = existingGroup.services.find(s => s.service_id === service_id);
              if (existingService) {
                existingService.products.push({ product_id, product_description, product_name });
              } else {
                existingGroup.services.push(service);
              }
            } else {
              groups.push(group);
            }
            return groups;
          }, []);
          status = 200;
          responseObj = {
            message: "success",
            data: output,
            count: res.rows[0].count
          };
        } else {
          status = 400;
          responseObj = {
            message: "no result found !",
          };
        }
      }
      apiResponseHandler.status(status).send(responseObj);
    });
  } else {
    apiResponseHandler.status(400).send({
      message: "error",
      error: "Failed to access the pool, please check DB !!!"
    })
  }
}

function deleteServiceMetaInfo(pool, apiResponseHandler, group_id, service_id, product_id) {
  if (pool) {
    pool.query(`
    DELETE FROM "Service_Meta_Data" WHERE "group_id" = '${group_id}' AND "service_id" = '${service_id}' AND "product_id" = '${product_id}';
        `, (err, res) => {
          if(err) {
            apiResponseHandler.status(400).send({
              message: 'error',
              error: err
            });
          } else {
            apiResponseHandler.send({
              message: 'success',
            });
          }
    });
  } else {
    apiResponseHandler.status(400).send({
      message: "error",
      error: "Failed to access the pool, please check DB !!!"
    })
  }
}


function setupUserConfigData(pool, apiResponseHandler, data) {
  if (pool) {
    pool.query('TRUNCATE TABLE "Service_Meta_Data", "Group", "Service", "Product";', (err, res) => {
      if (err) {
        apiResponseHandler.status(400).send({
          message: 'This is an error!',
          error: err
        });
      } else {
        let serviceMetaTable = {
          table: "Service_Meta_Data",
          data: [],
          keys: ['group_id', 'service_id', 'product_id']
        };
        let serviceData = {
          table: "Service",
          data: [],
          keys: ['service_id', 'service_name']
        }
        let productData = {
          table: "Product",
          data: [],
          keys: ['product_id', 'product_name']
        }
        let groupData = {
          table: "Group",
          data: [],
          keys: ['group_id', 'group_name']
        }

        const serviceHolder = {};
        const productHolder = {};
        const groupHolder = {};
        for (let d = 0; d < data.length; d++) {
          const dataRef = data[d];
          const groupId = dataRef.group_id;
          const services = dataRef.services;
          if (!groupHolder[groupId]) {
            groupHolder[groupId] = true;
            groupData.data.push(`('${groupId}', '${dataRef.group_name}')`)
          }
          for (let i = 0; i < services.length; i++) {
            const serviceId = services[i].service_id;
            if (!serviceHolder[serviceId]) {
              serviceHolder[serviceId] = true;
              serviceData.data.push(`('${serviceId}', '${serviceId}')`);
            }
            const products = services[i].products;
            for (let j = 0; j < products.length; j++) {
              const productId = products[j].product_id;
              if (!productHolder[productId]) {
                productHolder[productId] = true;
                productData.data.push(`('${productId}', '${productId}')`);
              }
              serviceMetaTable.data.push(`('${groupId}', '${serviceId}', '${products[j].product_id}')`)
            }
          }
        }
        
        let query = insertBulkDataIntoTableQuery(groupData.table, groupData.keys, groupData.data);
        query += insertBulkDataIntoTableQuery(serviceData.table, serviceData.keys, serviceData.data);
        query += insertBulkDataIntoTableQuery(productData.table, productData.keys, productData.data);
        query += insertBulkDataIntoTableQuery(serviceMetaTable.table, serviceMetaTable.keys, serviceMetaTable.data);

        pool.query(query, (err, res) => {
          if(err) {
            apiResponseHandler.status(400).send({
              message: 'This is an error!',
              error: err
            });
          } else {
            apiResponseHandler.send({
              message: "success"
            })
          }
        });
      }
    });

  } else {
    apiResponseHandler.status(400).send({
      message: "error",
      error: "Failed to access the pool, please check DB !!!"
    })
  }
}

function removeAllUserConfigData(pool, apiResponseHandler) {
  if (pool) {
    try {
      pool.query('TRUNCATE TABLE "Service_Meta_Data", "Group", "Service", "Product";', (err, res) => {
        if (err) {
          apiResponseHandler.status(400).send({
            message: "error",
            data: res,
            error: err
          });
        } else {
          apiResponseHandler.status(200).send({
            message: "success",
          });
        }
      });
    } catch (e) {

    }
  } else {
    apiResponseHandler.status(400).send({
      message: "error",
      error: "Failed to access the pool, please check DB !!!"
    })
  }
}

module.exports = {
  getAllGroups: getAllGroups,
  getAllProducts: getAllProducts,
  getAllServices: getAllServices,
  getAllServiceMetaInfo: getAllServiceMetaInfo,
  updateServiceMetaInfo: updateServiceMetaInfo,
  setupUserConfigData: setupUserConfigData,
  addServiceMetaInfo: addServiceMetaInfo,
  deleteServiceMetaInfo: deleteServiceMetaInfo,
  removeAllUserConfigData: removeAllUserConfigData
}