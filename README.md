# Fortify-Alpha
backend for OT6.5 that uses game data to be more accurate

important
- to make an account just login with the username you want before the @
- passwords are hashed and are enforced based on said username
- use the email suffix "@reset.me" to reset your profile when logging in
- outpost mission is skipped because you cant load into outpost, causes some funky stuff with tutorial (restart game if anything happens)
- uses mongodb

done
- quest progression (almost, still need to finish notifications)
- building survivor slots
- profile system
- creating buildings
- upgrading schems/workers/buildings (havent put in resource checks for workers and buildings yet)
- tutorial functional (outpost mission is skipped)
- cloudstorage (uses ztsd to compress and stick in in mongo, not production worthy use an s3 bucket for that)
- hero creation and perk stuff, currently when you create a hero it will start at max level

not done
- missing some mcp operations probably
- llamas
- world info is a newer version then intended, i cant be bothered to make one (if someone wants to go for it, you can find all the missiongens and zonethemes in the ot files)
- outposts work differently in ot not sure but idk i'll probably look into it eventually
