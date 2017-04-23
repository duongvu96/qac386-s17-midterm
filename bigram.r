library(NLP)
library(tm)

setwd("~/Desktop/dev/qac386-02")

argusData = read.csv('./js-server/public/argus_civil_engagement.csv')
argusDataStr = paste(argusData$content, collapse=" ")

groupData = read.csv('./js-server/public/group_responses.csv')
groupDataStr = paste(groupData$phrase, collapse=" ")

process_bigrams <- function(s, filename) {
  str = gsub("[0-9]", "", str)
  str = gsub("[[:punct:]]", "", str)
  str = gsub("  ", " ", str)
  str = tolower(str)
  
  word_vec = strsplit(argusDataStr, split=" ")[[1]]
  word_vec = word_vec[!word_vec %in% stopwords('en')]
  
  ## remove empty entries (arising from spaces)
  r = nchar(word_vec)
  word_vec = word_vec[r>1]
  
  x = ngrams(word_vec, n=2)
  bigrams = unlist(sapply(x, paste, collapse=" "))
  bigrams_df = data.frame(Phrases=bigrams, stringsAsFactors = F)
  write.csv(bigrams_df, paste(c(filename, "_bigrams.csv"), collapse = ""), row.names=F)
}