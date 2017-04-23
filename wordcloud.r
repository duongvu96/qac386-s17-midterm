library(tm)
library(wordcloud)

setwd("~/Desktop/dev/qac386-02")

argusData = read.csv('./js-server/public/argus_all_key_phrases.csv')
argusDataStr = paste(argusData$phrase, collapse=" ")

groupData = read.csv('./js-server/public/group_responses_all_key_phrases.csv')
groupDataStr = paste(groupData$phrase, collapse=" ")

dtm = DocumentTermMatrix(Corpus(VectorSource(groupDataStr)),
                         control=list(removePunctuation=TRUE,
                                      tolower=TRUE,
                                      removeNumbers=TRUE,
                                      stopwords=c("the", "a", "and", "is", "are",
                                                  "will", "were", "have", "been", "would")
                         )
)
dtm_mat = as.matrix(dtm)
tf = dtm_mat[1, ]
w = colnames(dtm_mat)

wordcloud(words=w, freq=tf)
