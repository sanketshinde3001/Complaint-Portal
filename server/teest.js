const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dtiqu7jby',  // Replace with your Cloudinary cloud name
  api_key: '378246757229118',         // Replace with your Cloudinary API key
  api_secret: 's0cAo3AnFirH3Erk0aMl7QjOx1s'   // Replace with your Cloudinary API secret
});

// Upload an image
cloudinary.uploader.upload("K:/complaint/server/aa.jpg", 
  { public_id: "my_image" }, // Optional: Set a public ID
  function(error, result) {
    if (error) {
      console.error(error);
    } else {
      console.log(result);
      console.log(result.secure_url); // Log the secure URL of the uploaded image
    }
  });

// Get image details (example)
cloudinary.api.resource("my_image", function(error, result){
  console.log(result);
});

//Generate an image tag
const imageTag = cloudinary.image("my_image", {transformation: [
      {width: 400, height: 400, crop: "fill"}
    ]});

console.log(imageTag)