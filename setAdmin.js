"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var firebase_admin_1 = require("firebase-admin");
var firestore_1 = require("firebase-admin/firestore");
var fs = require("fs");
var path = require("path");
// Construct the path to the service account key file
var keyPath = path.join(__dirname, 'serviceAccountKey.json');
// Read and parse the service account key file
var serviceAccount;
try {
    var keyFile = fs.readFileSync(keyPath, 'utf8');
    serviceAccount = JSON.parse(keyFile);
}
catch (error) {
    console.error('Error reading or parsing service account key file:', error);
    process.exit(1);
}
// Initialize the Firebase Admin SDK
try {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
}
catch (error) {
    if (error.code === 'app/duplicate-app') {
        console.log('Firebase Admin SDK already initialized.');
        firebase_admin_1.default.app(); // Get the already initialized app
    }
    else {
        console.error('Error initializing Firebase Admin SDK:', error);
        process.exit(1);
    }
}
// The email of the user to make an admin
var emailToMakeAdmin = 'waseem982878@gmail.com';
// Get a reference to the Firestore database
var db = (0, firestore_1.getFirestore)();
function makeAdmin() {
    return __awaiter(this, void 0, void 0, function () {
        var usersRef, querySnapshot, updates, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    console.log("Searching for user with email: ".concat(emailToMakeAdmin));
                    usersRef = db.collection('users');
                    return [4 /*yield*/, usersRef.where('email', '==', emailToMakeAdmin).get()];
                case 1:
                    querySnapshot = _a.sent();
                    if (querySnapshot.empty) {
                        console.log("No user found with email ".concat(emailToMakeAdmin, "."));
                        return [2 /*return*/];
                    }
                    updates = querySnapshot.docs.map(function (doc) {
                        console.log("Found user: ".concat(doc.id, ". Current role: ").concat(doc.data().role));
                        return db.collection('users').doc(doc.id).update({
                            role: 'superadmin'
                        }).then(function () {
                            console.log("Successfully updated role to 'superadmin' for user ".concat(doc.id));
                        });
                    });
                    return [4 /*yield*/, Promise.all(updates)];
                case 2:
                    _a.sent();
                    console.log('All admin updates completed.');
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error setting admin role:', error_1);
                    return [3 /*break*/, 5];
                case 4: return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Run the function
makeAdmin();
