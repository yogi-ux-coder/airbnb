const axios = require("axios");
const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    return res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    return res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res) => {
    const location = req.body.listing.location;

    let geoResponse;
    try {
        geoResponse = await axios.get(
            `https://api.maptiler.com/geocoding/${encodeURIComponent(location)}.json`,
            {
                params: {
                    key: process.env.MAP_TOKEN,
                    limit: 1,
                },
            }
        );
    } catch (e) {
        req.flash("error", "Location service unavailable");
        return res.redirect("/listings/new");
    }

    if (!geoResponse.data.features.length) {
        req.flash("error", "Invalid location");
        return res.redirect("/listings/new");
    }

    const listing = new Listing(req.body.listing);
    listing.owner = req.user._id;
    listing.geometry = geoResponse.data.features[0].geometry;

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
    }

    await listing.save();
    req.flash("success", "New Listing Created!");
    return res.redirect("/listings");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    return res.render("listings/show.ejs", { listing });
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true }
    );

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const originalImageUrl = listing.image?.url
        ? listing.image.url.replace("/upload", "/upload/w_250")
        : null;

    return res.render("listings/show.ejs", {
        listing,
        mapToken: process.env.MAP_TOKEN,
    });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    return res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    return res.redirect("/listings");
};