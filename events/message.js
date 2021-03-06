const MALjs = require('MALjs');
const htmlToText = require('html-to-text');

const regex = /{{(.*?)}}/g;

module.exports = (client, msg) => {
    if(msg.author.bot) return;

    if (msg.content.indexOf(client.config.prefix) === 0) {

        const args = msg.content.split(/\s+/);
        const commandName = args.shift().slice(client.config.prefix.length).toLowerCase();

        if(responseList[commandName]){
            msg.channel.send(responseList[commandName]);
            return;
        }

        let command = client.commands.get(commandName);
        if(command){
            if(client.permlevel(msg) < command.help.permission){
                msg.channel.send("Insufficient Perms");
                return;
            }

            if(args[0] === "h"){
                msg.channel.send(`Command: ${command.help.name} \nDescription: ${command.help.description} \n\n\` Ex. ${command.help.usage}\``);
                return;
            }

            console.log("LOG CMD", `USER ${msg.author.username} RAN command | ${commandName} | from \n  GUILD:  | ${msg.guild.name} \n  CHANNEL:| #${msg.channel.name}\nusing ARGS {${args}}`);

            command.run(client, msg, args);
        }
    } else {
        
        let match;
        let regex_matches = [];
        while ((match = regex.exec(msg.content)) != null) {
            regex_matches.push(match[1]);
        }

        if (regex_matches.length > 0) {

            function levenshtein_distance (a, b){
                if(a.length == 0) return b.length; 
                if(b.length == 0) return a.length; 

                let matrix = [];

                // increment along the first column of each row
                let i;
                for(i = 0; i <= b.length; i++){
                    matrix[i] = [i];
                }

                // increment each column in the first row
                let j;
                for(j = 0; j <= a.length; j++){
                    matrix[0][j] = j;
                }

                // Fill in the rest of the matrix
                for(i = 1; i <= b.length; i++){
                    for(j = 1; j <= a.length; j++){
                        if(b.charAt(i-1) == a.charAt(j-1)){
                            matrix[i][j] = matrix[i-1][j-1];
                        } else {
                            matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                                    Math.min(matrix[i][j-1] + 1, // insertion
                                                             matrix[i-1][j] + 1)); // deletion
                        }
                    }
                }

                return matrix[b.length][a.length];
            };
            
            function format_message(anime) {
                
                const embed = client.createRichEmbed()
                                         .setTitle(anime.title[0].toString())
                                         .setDescription(htmlToText.fromString(anime.synopsis).replace(/\[.*?\]|\n/g, ""))
                                         .setThumbnail(anime.image[0].toString())
                                         .setURL("https://myanimelist.net/anime/" + anime.id + "/")
                                         .addField("Score", anime.score[0].toString())
                                         .addField("Episodes", anime.episodes[0].toString());

                msg.channel.send({embed});
            }

            const mal = new MALjs(client.config.mal_user, client.config.mal_pass);
            regex_matches.forEach(function (item) {
                mal.anime.search(item)
                   .then(result =>
                       {
                           let current_min = Number.MAX_SAFE_INTEGER;
                           let current_anime, temp;
                           result.anime.forEach(function (ani) {
                               if (current_min > (temp = levenshtein_distance(item, ani.title[0]))) {
                                   current_min = temp;
                                   current_anime = ani;
                               }
                           });
                           format_message(current_anime);
                       })
                   .catch(err => msg.channel.send("No results found for " + item));
            });
        }
    }

};

let responseList = {
    "help": "Come see me complete in October",
    "ping": "pong",
    "tableflip": "(╯°□°）╯︵ ┻━┻)",
    "lenny": "( ͡° ͜ʖ ͡°)",
    "shrug": "¯\_(ツ)_/¯",
    "utmcutoff": "The CGPA requirement for both the May and August 2017 POSt admissions periods is 2.70 for the CSC major and all CSC specialists.",
    "sgcutoff": "The CGPA is",
    "faq": "**FAQ**\n POSt/Program Enrollment UTSG: http://www.artsci.utoronto.ca/current/program/enrolment-instructions/index_html \n" +
           "POSt/Program Enrollment UTM: https://www.utm.utoronto.ca/registrar/office-registrar-publications/program-selection-guide-2017 \n" +
           "POSt/Program Enrollment UTSC: http://www.utsc.utoronto.ca/aacc/enrolling-subject-posts \n" +
           "UTM Program Requirements: http://www.utm.utoronto.ca/programs-departments \n" +
           "UTM CGPA Calculator: https://student.utm.utoronto.ca/cgpa/ \n" +
           "UTSC GPA Calculator: http://www.utsc.utoronto.ca/webapps/aacc-tools/GPA_calculator/index.cgi \n" +
           "Coursegraphy: https://courseography.cdf.toronto.edu/graph"
};
