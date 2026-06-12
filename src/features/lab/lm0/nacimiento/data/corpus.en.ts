/**
 * corpus.en — what the baby machine reads in English: Hamlet, around the soliloquy.
 * Sliced verbatim from the public-domain source; the babbler folds it onto the
 * 27-letter alphabet at runtime (accents folded, punctuation -> space).
 */
import type { Corpus } from "./corpusTypes";

export const corpusEn: Corpus = {
  attribution: "William Shakespeare — Hamlet (1603). Project Gutenberg #1524.",
  memorizedPhrase: "to be, or not to be, that is the question",
  raw: `With eyes like carbuncles, the hellish Pyrrhus
   Old grandsire Priam seeks._
So, proceed you.

POLONIUS.
’Fore God, my lord, well spoken, with good accent and good discretion.

FIRST PLAYER.
   _Anon he finds him,
   Striking too short at Greeks. His antique sword,
   Rebellious to his arm, lies where it falls,
   Repugnant to command. Unequal match’d,
   Pyrrhus at Priam drives, in rage strikes wide;
   But with the whiff and wind of his fell sword
   Th’unnerved father falls. Then senseless Ilium,
   Seeming to feel this blow, with flaming top
   Stoops to his base, and with a hideous crash
   Takes prisoner Pyrrhus’ ear. For lo, his sword,
   Which was declining on the milky head
   Of reverend Priam, seem’d i’ th’air to stick.
   So, as a painted tyrant, Pyrrhus stood,
   And like a neutral to his will and matter,
   Did nothing.
   But as we often see against some storm,
   A silence in the heavens, the rack stand still,
   The bold winds speechless, and the orb below
   As hush as death, anon the dreadful thunder
   Doth rend the region; so after Pyrrhus’ pause,
   Aroused vengeance sets him new a-work,
   And never did the Cyclops’ hammers fall
   On Mars’s armour, forg’d for proof eterne,
   With less remorse than Pyrrhus’ bleeding sword
   Now falls on Priam.
   Out, out, thou strumpet Fortune! All you gods,
   In general synod, take away her power;
   Break all the spokes and fellies from her wheel,
   And bowl the round nave down the hill of heaven,
   As low as to the fiends._

POLONIUS.
This is too long.

HAMLET.
It shall to the barber’s, with your beard.—Prithee say on.
He’s for a jig or a tale of bawdry, or he sleeps.
Say on; come to Hecuba.

FIRST PLAYER.
   _But who, O who, had seen the mobled queen,—_

HAMLET.
‘The mobled queen’?

POLONIUS.
That’s good! ‘Mobled queen’ is good.

FIRST PLAYER.
   _Run barefoot up and down, threat’ning the flames
   With bisson rheum. A clout upon that head
   Where late the diadem stood, and for a robe,
   About her lank and all o’erteemed loins,
   A blanket, in th’alarm of fear caught up—
   Who this had seen, with tongue in venom steep’d,
   ’Gainst Fortune’s state would treason have pronounc’d.
   But if the gods themselves did see her then,
   When she saw Pyrrhus make malicious sport
   In mincing with his sword her husband’s limbs,
   The instant burst of clamour that she made,—
   Unless things mortal move them not at all,—
   Would have made milch the burning eyes of heaven,
   And passion in the gods._

POLONIUS.
Look, where he has not turn’d his colour, and has tears in’s eyes. Pray
you, no more.

HAMLET.
’Tis well. I’ll have thee speak out the rest of this soon.—Good my
lord, will you see the players well bestowed? Do you hear, let them be
well used; for they are the abstracts and brief chronicles of the time.
After your death you were better have a bad epitaph than their ill
report while you live.

POLONIUS.
My lord, I will use them according to their desert.

HAMLET.
God’s bodikin, man, much better. Use every man after his desert, and who
should ’scape whipping? Use them after your own honour and dignity. The
less they deserve, the more merit is in your bounty. Take them in.

POLONIUS.
Come, sirs.

HAMLET.
Follow him, friends. We’ll hear a play tomorrow.

[_Exeunt Polonius with all the Players but the First._]

Dost thou hear me, old friend? Can you play _The Murder of Gonzago_?

FIRST PLAYER.
Ay, my lord.

HAMLET.
We’ll ha’t tomorrow night. You could for a need study a speech of some
dozen or sixteen lines, which I would set down and insert in’t, could
you not?

FIRST PLAYER.
Ay, my lord.

HAMLET.
Very well. Follow that lord, and look you mock him not.

[_Exit First Player._]

[_To Rosencrantz and Guildenstern_] My good friends, I’ll leave you
till night. You are welcome to Elsinore.

ROSENCRANTZ.
Good my lord.

[_Exeunt Rosencrantz and Guildenstern._]

HAMLET.
Ay, so, God b’ wi’ ye. Now I am alone.
O what a rogue and peasant slave am I!
Is it not monstrous that this player here,
But in a fiction, in a dream of passion,
Could force his soul so to his own conceit
That from her working all his visage wan’d;
Tears in his eyes, distraction in’s aspect,
A broken voice, and his whole function suiting
With forms to his conceit? And all for nothing!
For Hecuba?
What’s Hecuba to him, or he to Hecuba,
That he should weep for her? What would he do,
Had he the motive and the cue for passion
That I have? He would drown the stage with tears
And cleave the general ear with horrid speech;
Make mad the guilty, and appal the free,
Confound the ignorant, and amaze indeed,
The very faculties of eyes and ears. Yet I,
A dull and muddy-mettled rascal, peak
Like John-a-dreams, unpregnant of my cause,
And can say nothing. No, not for a king
Upon whose property and most dear life
A damn’d defeat was made. Am I a coward?
Who calls me villain, breaks my pate across?
Plucks off my beard and blows it in my face?
Tweaks me by the nose, gives me the lie i’ th’ throat
As deep as to the lungs? Who does me this?
Ha! ’Swounds, I should take it: for it cannot be
But I am pigeon-liver’d, and lack gall
To make oppression bitter, or ere this
I should have fatted all the region kites
With this slave’s offal. Bloody, bawdy villain!
Remorseless, treacherous, lecherous, kindless villain!
Oh vengeance!
Why, what an ass am I! This is most brave,
That I, the son of a dear father murder’d,
Prompted to my revenge by heaven and hell,
Must, like a whore, unpack my heart with words
And fall a-cursing like a very drab,
A scullion! Fie upon’t! Foh!
About, my brain! I have heard
That guilty creatures sitting at a play,
Have by the very cunning of the scene,
Been struck so to the soul that presently
They have proclaim’d their malefactions.
For murder, though it have no tongue, will speak
With most miraculous organ. I’ll have these players
Play something like the murder of my father
Before mine uncle. I’ll observe his looks;
I’ll tent him to the quick. If he but blench,
I know my course. The spirit that I have seen
May be the devil, and the devil hath power
T’assume a pleasing shape, yea, and perhaps
Out of my weakness and my melancholy,
As he is very potent with such spirits,
Abuses me to damn me. I’ll have grounds
More relative than this. The play’s the thing
Wherein I’ll catch the conscience of the King.

[_Exit._]




ACT III

SCENE I. A room in the Castle.


Enter King, Queen, Polonius, Ophelia, Rosencrantz and Guildenstern.

KING.
And can you by no drift of circumstance
Get from him why he puts on this confusion,
Grating so harshly all his days of quiet
With turbulent and dangerous lunacy?

ROSENCRANTZ.
He does confess he feels himself distracted,
But from what cause he will by no means speak.

GUILDENSTERN.
Nor do we find him forward to be sounded,
But with a crafty madness keeps aloof
When we would bring him on to some confession
Of his true state.

QUEEN.
Did he receive you well?

ROSENCRANTZ.
Most like a gentleman.

GUILDENSTERN.
But with much forcing of his disposition.

ROSENCRANTZ.
Niggard of question, but of our demands,
Most free in his reply.

QUEEN.
Did you assay him to any pastime?

ROSENCRANTZ.
Madam, it so fell out that certain players
We o’er-raught on the way. Of these we told him,
And there did seem in him a kind of joy
To hear of it. They are about the court,
And, as I think, they have already order
This night to play before him.

POLONIUS.
’Tis most true;
And he beseech’d me to entreat your Majesties
To hear and see the matter.

KING.
With all my heart; and it doth much content me
To hear him so inclin’d.
Good gentlemen, give him a further edge,
And drive his purpose on to these delights.

ROSENCRANTZ.
We shall, my lord.

[_Exeunt Rosencrantz and Guildenstern._]

KING.
Sweet Gertrude, leave us too,
For we have closely sent for Hamlet hither,
That he, as ’twere by accident, may here
Affront Ophelia.
Her father and myself, lawful espials,
Will so bestow ourselves that, seeing unseen,
We may of their encounter frankly judge,
And gather by him, as he is behav’d,
If’t be th’affliction of his love or no
That thus he suffers for.

QUEEN.
I shall obey you.
And for your part, Ophelia, I do wish
That your good beauties be the happy cause
Of Hamlet’s wildness: so shall I hope your virtues
Will bring him to his wonted way again,
To both your honours.

OPHELIA.
Madam, I wish it may.

[_Exit Queen._]

POLONIUS.
Ophelia, walk you here.—Gracious, so please you,
We will bestow ourselves.—[_To Ophelia._] Read on this book,
That show of such an exercise may colour
Your loneliness.—We are oft to blame in this,
’Tis too much prov’d, that with devotion’s visage
And pious action we do sugar o’er
The devil himself.

KING.
[_Aside._] O ’tis too true!
How smart a lash that speech doth give my conscience!
The harlot’s cheek, beautied with plastering art,
Is not more ugly to the thing that helps it
Than is my deed to my most painted word.
O heavy burden!

POLONIUS.
I hear him coming. Let’s withdraw, my lord.

[_Exeunt King and Polonius._]

Enter Hamlet.

HAMLET.
To be, or not to be, that is the question:
Whether ’tis nobler in the mind to suffer
The slings and arrows of outrageous fortune,
Or to take arms against a sea of troubles,
And by opposing end them? To die—to sleep,
No more; and by a sleep to say we end
The heart-ache, and the thousand natural shocks
That flesh is heir to: ’tis a consummation
Devoutly to be wish’d. To die, to sleep.
To sleep, perchance to dream—ay, there’s the rub,
For in that sleep of death what dreams may come,
When we have shuffled off this mortal coil,
Must give us pause. There’s the respect
That makes calamity of so long life.
For who would bear the whips and scorns of time,
The oppressor’s wrong, the proud man’s contumely,
The pangs of dispriz’d love, the law’s delay,
The insolence of office, and the spurns
That patient merit of the unworthy takes,
When he himself might his quietus make
With a bare bodkin? Who would these fardels bear,
To grunt and sweat under a weary life,
But that the dread of something after death,
The undiscover’d country, from whose bourn
No traveller returns, puzzles the will,
And makes us rather bear those ills we have
Than fly to others that we know not of?
Thus conscience does make cowards of us all,
And thus the native hue of resolution
Is sicklied o’er with the pale cast of thought,
And enterprises of great pith and moment,
With this regard their currents turn awry
And lose the name of action. Soft you now,
The fair Ophelia! Nymph, in thy orisons
Be all my sins remember’d.

OPHELIA.
Good my lord,
How does your honour for this many a day?

HAMLET.
I humbly thank you; well, well, well.

OPHELIA.
My lord, I have remembrances of yours
That I have longed long to re-deliver.
I pray you, now receive them.

HAMLET.
No, not I.
I never gave you aught.

OPHELIA.
My honour’d lord, you know right well you did,
And with them words of so sweet breath compos’d
As made the things more rich; their perfume lost,
Take these again; for to the noble mind
Rich gifts wax poor when givers prove unkind.
There, my lord.

HAMLET.
Ha, ha! Are you honest?

OPHELIA.
My lord?

HAMLET.
Are you fair?

OPHELIA.
What means your lordship?

HAMLET.
That if you be honest and fair, your honesty should admit no discourse
to your beauty.

OPHELIA.
Could beauty, my lord, have better commerce than with honesty?

HAMLET.
Ay, truly; for the power of beauty will sooner transform honesty from
what it is to a bawd than the force of honesty can translate beauty
into his likeness. This was sometime a paradox, but now the time gives
it proof. I did love you once.

OPHELIA.
Indeed, my lord, you made me believe so.

HAMLET.
You should not have believed me; for virtue cannot so inoculate our old
stock but we shall relish of it. I loved you not.

OPHELIA.
I was the more deceived.

HAMLET.
Get thee to a nunnery. Why wouldst thou be a breeder of sinners? I am
myself indifferent honest; but yet I could accuse me of such things
that it were better my mother had not borne me. I am very proud,
revengeful, ambitious, with more offences at my beck than I have
thoughts to put them in, imagination to give them shape, or time to act
them in. What should such fellows as I do crawling between earth and
heaven? We are arrant knaves all, believe none of us. Go thy ways to a
nunnery. Where’s your father?

OPHELIA.
At home, my lord.

HAMLET.
Let the doors be shut upon him, that he may play the fool nowhere but
in’s own house. Farewell.

OPHELIA.
O help him, you sweet heavens!

HAMLET.
If thou dost marry, I’ll give thee this plague for thy dowry. Be thou
as chaste as ice, as pure as snow, thou shalt not escape calumny. Get
thee to a nunnery, go: farewell. Or if thou wilt needs marry, marry a
fool; for wise men know well enough what monsters you make of them. To
a nunnery, go; and quickly too. Farewell.

OPHELIA.
O heavenly powers, restore him!

HAMLET.
I have heard of your paintings too, well enough. God hath given you one
face, and you make yourselves another. You jig, you amble, and you
lisp, and nickname God’s creatures, and make your wantonness your
ignorance. Go to, I’ll no more on’t, it hath made me mad. I say, we
will have no more marriages. Those that are married already, all but
one, shall live; the rest shall keep as they are. To a nunnery, go.

[_Exit._]

OPHELIA.
O, what a noble mind is here o’erthrown!
The courtier’s, soldier’s, scholar’s, eye, tongue, sword,
Th’expectancy and rose of the fair state,
The glass of fashion and the mould of form,
Th’observ’d of all observers, quite, quite down!
And I, of ladies most deject and wretched,
That suck’d the honey of his music vows,
Now see that noble and most sovereign reason,
Like sweet bells jangled out of tune and harsh,
That unmatch’d form and feature of blown youth
Blasted with ecstasy. O woe is me,
T’have seen what I have seen, see what I see.

Enter King and Polonius.

KING.
Love? His affections do not that way tend,
Nor what he spake, though it lack’d form a little,
Was not like madness. There’s something in his soul
O’er which his melancholy sits on brood,
And I do doubt the hatch and the disclose
Will be some danger, which for to prevent,
I have in quick determination
Thus set it down: he shall with speed to England
For the demand of our neglected tribute:
Haply the seas and countries different,
With variable objects, shall expel
This something settled matter in his heart,
Whereon his brains still beating puts him thus
From fashion of himself. What think you on’t?

POLONIUS.
It shall do well. But yet do I believe
The origin and commencement of his grief
Sprung from neglected love. How now, Ophelia?
You need not tell us what Lord Hamlet said,
We heard it all. My lord, do as you please,
But if you hold it fit, after the play,
Let his queen mother all alone entreat him
To show his grief, let her be round with him,
And I’ll be plac’d, so please you, in the ear
Of all their conference. If she find him not,
To England send him; or confine him where
Your wisdom best shall think.

KING.
It shall be so.
Madness in great ones must not unwatch’d go.

[_Exeunt._]

 SCENE II. A hall in the Castle.

Enter Hamlet and certain Players.

HAMLET.
Speak the speech, I pray you, as I pronounced it to you, trippingly on
the tongue. But if you mouth it, as many of your players do, I had as
lief the town-crier spoke my lines. Nor do not saw the air too much
with your hand, thus, but use all gently; for in the very torrent,
tempest, and, as I may say, whirlwind of passion, you must acquire and
beget a temperance that may give it smoothness. O, it offends me to the
soul to hear a robustious periwig-pated fellow tear a passion to
tatters, to very rags, to split the ears of the groundlings, who, for
the most part, are capable of nothing but inexplicable dumb shows and
noise. I would have such a fellow whipped for o’erdoing Termagant. It
out-Herods Herod. Pray you avoid it.

FIRST PLAYER.
I warrant your honour.

HAMLET.
Be not too tame neither; but let your own discretion be your tutor.
Suit the action to the word, the word to the action, with this special
observance, that you o’erstep not the modesty of nature; for anything
so overdone is from the purpose of playing, whose end, both at the
first and now, was and is, to hold as ’twere the mirror up to nature;
to show virtue her own feature, scorn her own image, and the very age
and body of the time his form and pressure. Now, this overdone, or come
tardy off, though it make the unskilful laugh, cannot but make the
judicious grieve; the censure of the which one must in your allowance
o’erweigh a whole theatre of others. O, there be players that I have
seen play—and heard others praise, and that highly—not to speak it
profanely, that, neither having the accent of Christians, nor the gait
of Christian, pagan, nor man, have so strutted and bellowed that I have
thought some of Nature’s journeymen had made men, and not made them
well, they imitated humanity so abominably.

FIRST PLAYER.
I hope we have reform’d that indifferently with us, sir.

HAMLET.
O reform it altogether. And let those that play your clowns speak no
more than is set down for them. For there be of them that will
themselves laugh, to set on some quantity of barren spectators to laugh
too, though in the meantime some necessary question of the play be then
to be considered. That’s villainous, and shows a most pitiful ambition
in the fool that uses it. Go make you ready.

[_Exeunt Players._]

Enter Polonius, Rosencrantz and Guildenstern.

How now, my lord?
Will the King hear this piece of work?

POLONIUS.
And the Queen too, and that presently.

HAMLET.
Bid the players make haste.

[_Exit Polonius._]

Will you two help to hasten them?

ROSENCRANTZ and GUILDENSTERN.
We will, my lord.

[_Exeunt Rosencrantz and Guildenstern._]

HAMLET.
What ho, Horatio!

Enter Horatio.

HORATIO.
Here, sweet lord, at your service.

HAMLET.
Horatio, thou art e’en as just a man
As e’er my conversation cop’d withal.

HORATIO.
O my dear lord.

HAMLET.
Nay, do not think I flatter;
For what advancement may I hope from thee,
That no revenue hast, but thy good spirits
To feed and clothe thee? Why should the poor be flatter’d?
No, let the candied tongue lick absurd pomp,
And crook the pregnant hinges of the knee
Where thrift may follow fawning. Dost thou hear?
Since my dear soul was mistress of her choice,
And could of men distinguish, her election
Hath seal’d thee for herself. For thou hast been
As one, in suffering all, that suffers nothing,
A man that Fortune’s buffets and rewards
Hast ta’en with equal thanks. And blessed are those
Whose blood and judgement are so well co-mingled
That they are not a pipe for Fortune’s finger
To sound what stop she please. Give me that man
That is not passion’s slave, and I will wear him
In my heart’s core, ay, in my heart of heart,
As I do thee. Something too much of this.
There is a play tonight before the King.
One scene of it comes near the circumstance
Which I have told thee, of my father’s death.
I prithee, when thou see’st that act a-foot,
Even with the very comment of thy soul
Observe mine uncle. If his occulted guilt
Do not itself unkennel in one speech,
It is a damned ghost that we have seen;
And my imaginations are as foul
As Vulcan’s stithy. Give him heedful note;
For I mine eyes will rivet to his face;
And after we will both our judgements join
In censure of his seeming.

HORATIO.
Well, my lord.
If he steal aught the whilst this play is playing,
And ’scape detecting, I will pay the theft.

HAMLET.
They are coming to the play. I must be idle.
Get you a place.

Danish march. A flourish. Enter King, Queen, Polonius, Ophelia,
Rosencrantz, Guildenstern and others.

KING.
How fares our cousin Hamlet?

HAMLET.
Excellent, i’ faith; of the chameleon’s dish: I eat the air,
promise-crammed: you cannot feed capons so.

KING.
I have nothing with this answer, Hamlet; these words are not mine.

HAMLET.
No, nor mine now. [_To Polonius._] My lord, you play’d once i’
th’university, you say?

POLONIUS.
That did I, my lord, and was accounted a good actor.

HAMLET.
What did you enact?

POLONIUS.
I did enact Julius Caesar. I was kill’d i’ th’ Capitol. Brutus killed
me.

HAMLET.
It was a brute part of him to kill so capital a calf there. Be the
players ready?

ROSENCRANTZ.
Ay, my lord; they stay upon your patience.

QUEEN.
Come hither, my dear Hamlet, sit by me.

HAMLET.
No, good mother, here’s metal more attractive.

POLONIUS.
[_To the King._] O ho! do you mark that?

HAMLET.
Lady, shall I lie in your lap?

[_Lying down at Ophelia’s feet._]

OPHELIA.
No, my lord.

HAMLET.
I mean, my head upon your lap?

OPHELIA.
Ay, my lord.

HAMLET.
Do you think I meant country matters?

OPHELIA.
I think nothing, my lord.

HAMLET.
That’s a fair thought to lie between maids’ legs.

OPHELIA.
What is, my lord?

HAMLET.
Nothing.

OPHELIA.
You are merry, my lord.

HAMLET.
Who, I?

OPHELIA.
Ay, my lord.

HAMLET.
O God, your only jig-maker! What should a man do but be merry? For look
you how cheerfully my mother looks, and my father died within’s two
hours.

OPHELIA.
Nay, ’tis twice two months, my lord.

HAMLET.
So long? Nay then, let the devil wear black, for I’ll have a suit of
sables. O heavens! die two months ago, and not forgotten yet? Then
there’s hope a great man’s memory may outlive his life half a year. But
by’r lady, he must build churches then; or else shall he suffer not
thinking on, with the hobby-horse, whose epitaph is ‘For, O, for O, the
hobby-horse is forgot!’

Trumpets sound. The dumb show enters.

_Enter a King and a Queen very lovingly; the Queen embracing him and he
her. She kneels, and makes show of protestation unto him. He takes her
up, and declines his head upon her neck. Lays him down upon a bank of
flowers. She, seeing him asleep, leaves him. Anon comes in a fellow,
takes off his crown, kisses it, pours poison in the King’s ears, and
exits. The Queen returns, finds the King dead, and makes passionate
action. The Poisoner with some three or four Mutes, comes in again,
seeming to lament with her. The dead body is carried away. The Poisoner
woos the Queen with gifts. She seems loth and unwilling awhile, but in
the end accepts his love._

[_Exeunt._]

OPHELIA.
What means this, my lord?

HAMLET.
Marry, this is miching mallecho; it means mischief.

OPHELIA.
Belike this show imports the argument of the play.

Enter Prologue.

HAMLET.
We shall know by this fellow: the players cannot keep counsel; they’ll
tell all.

OPHELIA.
Will they tell us what this show meant?

HAMLET.
Ay, or any show that you’ll show him. Be not you ashamed to show, he’ll
not shame to tell you what it means.

OPHELIA.
You are naught, you are naught: I’ll mark the play.

PROLOGUE.
   _For us, and for our tragedy,
   Here stooping to your clemency,
   We beg your hearing patiently._

HAMLET.
Is this a prologue, or the posy of a ring?

OPHELIA.
’Tis brief, my lord.

HAMLET.
As woman’s love.

Enter a King and a Queen.

PLAYER KING.
Full thirty times hath Phoebus’ cart gone round
Neptune’s salt wash and Tellus’ orbed ground,
And thirty dozen moons with borrow’d sheen
About the world have times twelve thirties been,
Since love our hearts, and Hymen did our hands
Unite commutual in most sacred bands.

PLAYER QUEEN.
So many journeys may the sun and moon
Make us again count o’er ere love be done.
But, woe is me, you are so sick of late,
So far from cheer and from your former state,
That I distrust you. Yet, though I distrust,
Discomfort you, my lord, it nothing must:
For women’s fear and love holds quantity,
In neither aught, or in extremity.
Now what my love is, proof hath made you know,
And as my love is siz’d, my fear is so.
Where love is great, the littlest doubts are fear;
Where little fears grow great, great love grows there.

PLAYER KING.
Faith, I must leave thee, love, and shortly too:
My operant powers their functions leave to do:
And thou shalt live in this fair world behind,
Honour’d, belov’d, and haply one as kind
For husband shalt thou—

PLAYER QUEEN.
O confound the rest.
Such love must needs be treason in my breast.
In second husband let me be accurst!
None wed the second but who kill’d the first.

HAMLET.
[_Aside._] Wormwood, wormwood.

PLAYER QUEEN.
The instances that second marriage move
Are base respects of thrift, but none of love.
A second time I kill my husband dead,
When second husband kisses me in bed.

PLAYER KING.
I do believe you think what now you speak;
But what we do determine, oft we break.
Purpose is but the slave to memory,
Of violent birth, but poor validity:
Which now, like fruit unripe, sticks on the tree,
But fall unshaken when they mellow be.
Most necessary ’tis that we forget
To pay ourselves what to ourselves is debt.
What to ourselves in passion we propose,
The passion ending, doth the purpose lose.
The violence of either grief or joy
Their own enactures with themselves destroy.
Where joy most revels, grief doth most lament;
Grief joys, joy grieves, on slender accident.
This world is not for aye; nor ’tis not strange
That even our loves should with our fortunes change,
For ’tis a question left us yet to prove,
Whether love lead fortune, or else fortune love.
The great man down, you mark his favourite flies,
The poor advanc’d makes friends of enemies;
And hitherto doth love on fortune tend:
For who not needs shall never lack a friend,
And who in want a hollow friend doth try,
Directly seasons him his enemy.
But orderly to end where I begun,
Our wills and fates do so contrary run
That our devices still are overthrown.
Our thoughts are ours, their ends none of our own.
So think thou wilt no second husband wed,
But die thy thoughts when thy first lord is dead.

PLAYER QUEEN.
Nor earth to me give food, nor heaven light,
Sport and repose lock from me day and night,
To desperation turn my trust and hope,
An anchor’s cheer in prison be my scope,
Each opposite that blanks the face of joy,
Meet what I would have well, and it destroy!
Both here and hence pursue me lasting strife,
If, once a widow, ever I be wife.

HAMLET.
[_To Ophelia._] If she should break it now.

PLAYER KING.
’Tis deeply sworn. Sweet, leave me here awhile.
My spirits grow dull, and fain I would beguile
The tedious day with sleep.
[_Sleeps._]

PLAYER QUEEN.
Sleep rock thy brain,
And never come mischance between us twain.

[_Exit._]

HAMLET.
Madam, how like you this play?

QUEEN.
The lady protests too much, methinks.

HAMLET.
O, but she’ll keep her word.

KING.
Have you heard the argument? Is there no offence in’t?

HAMLET.
No, no, they do but jest, poison in jest; no offence i’ th’ world.

KING.
What do you call the play?

HAMLET.
_The Mousetrap._ Marry, how? Tropically. This play is the image of a
murder done in Vienna. Gonzago is the Duke’s name, his wife Baptista:
you shall see anon; ’tis a knavish piece of work: but what o’ that?
Your majesty, and we that have free souls, it touches us not. Let the
gall’d jade wince; our withers are unwrung.

Enter Lucianus.

This is one Lucianus, nephew to the King.

OPHELIA.
You are a good chorus, my lord.

HAMLET.
I could interpret between you and your love, if I could see the puppets
dallying.

OPHELIA.
You are keen, my lord, you are keen.

HAMLET.
It would cost you a groaning to take off my edge.

OPHELIA.
Still better, and worse.

HAMLET.
So you mistake your husbands.—Begin, murderer. Pox, leave thy damnable
faces, and begin. Come, the croaking raven doth bellow for revenge.

LUCIANUS.
Thoughts black, hands apt, drugs fit, and time agreeing,
Confederate season, else no creature seeing;
Thou mixture rank, of midnight weeds collected,
With Hecate’s ban thrice blasted, thrice infected,
Thy natural magic and dire property
On wholesome life usurp immediately.

[_Pours the poison into the sleeper’s ears._]

HAMLET.
He poisons him i’ th’garden for’s estate. His name’s Gonzago. The story
is extant, and written in very choice Italian. You shall see anon how
the murderer gets the love of Gonzago’s wife.

OPHELIA.
The King rises.`,
};
