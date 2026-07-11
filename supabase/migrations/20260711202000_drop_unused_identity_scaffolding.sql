-- profiles, identities, entities: 0 code references anywhere in the app, no FK
-- relationships. Three separate unfinished attempts at an identity abstraction
-- layer; users + clients + client_twins are the tables actually doing that job
-- today (32 and 33 code references respectively). Dropped rather than left as
-- extra unused "which one is real" noise.
DROP TABLE public.profiles;
DROP TABLE public.identities;
DROP TABLE public.entities;
