// const express = require('express');
// const app = express();
const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
// const bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded({ extended: true }));

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


// tristanjacobs@gmail.com // 
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool.query(`
    SELECT * 
    FROM users
    WHERE email = $1
    `,[email]
  )
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    return err.message;
  });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool.query(`
  SELECT * 
  FROM users
  WHERE id = $1
  `,[id]
)
.then((result) => {
  return result.rows[0];
})
.catch((err) => {
  return err.message;
});
  // return Promise.resolve(users[id]);
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  return pool.query(`
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3) RETURNING *;
  `,[user.name, user.email, user.password])
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    return err.message;
  });

  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool.query (`
    SELECT *, avg(property_reviews.rating) as average_rating
    FROM reservations
    JOIN properties ON properties.id = reservations.property_id
    JOIN property_reviews ON property_reviews.property_id = properties.id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id, property_reviews.id
    LIMIT $2;
  `,[guest_id, limit])
  .then((result) => {
    return result.rows;
  })
  .catch((err) => {
    return err.message;
  });

  // return getAllProperties(null, 2);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
    const queryParams = [];

    let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    `;

    let searchQuery = [];    

    if (options.city) {
      queryParams.push(`%${options.city}%`);
      searchQuery.push(` city LIKE $${queryParams.length}`);
    }

    if (options.owner_id) {
      queryParams.push(options.owner_id);
      searchQuery.push(` owner_id = $${queryParams.length}`);
    }

    if (options.minimum_price_per_night) {
      queryParams.push(options.minimum_price_per_night);
      searchQuery.push(` cost_per_night >= $${queryParams.length}`);
    }

    if (options.maximum_price_per_night) {
      queryParams.push(options.maximum_price_per_night);
      searchQuery.push(` cost_per_night <= $${queryParams.length}`);
    }

    if (options.minimum_rating) {
      queryParams.push(options.minimum_rating);
      searchQuery.push(` property_reviews.rating >= $${queryParams.length}`);
    }

    if (searchQuery.length !== 0) {
      queryString += `WHERE ${searchQuery.join(' AND ')}`;
    }
  
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
  
    // console.log(queryString, queryParams);
  
    return pool.query(queryString, queryParams).then((res) => res.rows);

  // return pool.query(`SELECT * FROM properties LIMIT $1`, [limit])
  //   .then((result) => {
  //     return result.rows;
  //   })
  //   .catch((err) => {
  //     return err.message;
  //   });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {

  let queryString = `
  INSERT INTO properties ( owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)`;

  queryString += `
  VALUES (
    ${property.owner_id},
    '${property.title}',
    '${property.description}',
    '${property.thumbnail_photo_url}',
    '${property.cover_photo_url}',
    '${property.cost_per_night}',
    '${property.street}',
    '${property.city}',
    '${property.province}',
    '${property.post_code}',
    '${property.country}',
    ${property.parking_spaces},
    ${property.number_of_bathrooms},
    ${property.number_of_bedrooms}) RETURNING *;
  `;

  return pool.query(queryString).then((res) => res.rows);
  
}
exports.addProperty = addProperty;


  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);
  // console.log("HERE", queryString);